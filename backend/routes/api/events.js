const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue, Event, EventImage, Attendance } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const membership = require('../../db/models/membership');
const attendance = require('../../db/models/attendance');

router.get('/:eventId/attendees', async (req, res) => {
  const { user } = req;
  const { eventId } = req.params;

  const event = await Event.findByPk(eventId)
  if (!event) {
    res.status(404).json({
      message: "Event couldn't be found"
    })
  }
  const group = await Group.findByPk(event.groupId)
  const attendees = await event.getNumAttending()
  const currentUser = await User.findByPk(user.id, {
    include: Membership
  })
  let cohost = []

  currentUser.Memberships.forEach(membership => {
    membership = membership.toJSON()
    // if currentUser's membership's groupId matches the event's group
    // and currentUser's membership's status in this group is cohost'
    if (membership.groupId === group.id && membership.status == 'co-host') {
      // console.log(true);
      cohost.push(true)
    }
  })

  let attendeeArr = []
  attendees.forEach(attendee => {
    attendee = attendee.toJSON()
    delete attendee.username
    attendee.Attendance = { status: attendee.Attendance.status}
    attendeeArr.push(attendee)
  })

  // if current user is organizer of group OR cohost
    // show everyone including pending
  if (user.id === group.organizerId || cohost.length) {
    return res.json({
      Attendees: attendeeArr
    })

  // if current user is NOT organizer OR cohost
    // show everyone EXCEPT pending
  } else {
    attendeeArr = attendeeArr.filter(attendee => attendee.Attendance.status !== 'pending')
    return res.json({
      Attendees: attendeeArr
    })
  }
})

router.get('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  
  const event = await Event.unscoped().findByPk(eventId, {
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    },
    include: [
      {
        model: User,
        as: 'numAttending'
      },
      { 
        model: Group,
        attributes: ['id', 'name', 'private', 'city', 'state']
      },
      {
        model: Venue,
        attributes: {
          exclude: ['groupId', 'createdAt', 'updatedAt']
        }
      },
      {
        model: EventImage,
        attributes: {
          exclude: ['eventId', 'createdAt', 'updatedAt']
        }
      }
    ]
  })
  
  if (!event) {
    res.status(404)
    res.json({
      message: "Event couldn't be found"
    })
  }
  const eventObj = event.toJSON()
  eventObj.numAttending = eventObj.numAttending.length
  
  res.json(eventObj)
})

router.get('/', async (req, res) => {
  const events = await Event.findAll({
    include: [
      {
        model: EventImage,
        attributes: ['url'],
        // where: {
        //   preview: true
        // }
      }, 
      {
        model: User,
        as: 'numAttending'
      },
      { 
        model: Group,
        attributes: ['id', 'name', 'city', 'state']
      },
      {
        model: Venue,
        attributes: ['id', 'city', 'state']
      }
    ]
  })

  let eventList = [];
  events.forEach(event => {
    eventList.push(event.toJSON())
  })

  eventList.forEach(event => {
    if (event.EventImages[0]) {
      event.previewImage = event.EventImages[0].url;
    }
    delete event.EventImages
    event.numAttending = event.numAttending.length
  })
  res.json({
    Events: eventList
  });
})

router.post('/:eventId/attendance', requireAuth, async (req, res) => {
  const { user } = req;
  const { eventId } = req.params;
  
  // check if event exists
  const event = await Event.findByPk(eventId)
  if (!event) {
    return res.status(404).json({
      message: "Event couldn't be found"
    })
  }
  // get the group
  const group = await Group.findByPk(event.groupId)
  // get the currentUser and associated memberships
  const currentUser = await User.findByPk(user.id, {
    include: [{
      model: Membership
    },
    {
      model: Attendance
    }]
  })
  const currentUserObj = currentUser.toJSON()
  // check to see if currentUser is a member of the group
  let isMember;
  currentUserObj.Memberships.forEach(membership => {
    if (membership.groupId === group.id) {
      isMember = true;
    }
  })
  // if they are not a member of the group, FORBIDDEN
  if (!isMember) {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }

  let attendance = [];
  currentUserObj.Attendances.forEach(event => {
    if (event.eventId == eventId) {
      attendance.push(event.status)
    }
  })

  // if currentUser is already pending
  if (attendance.includes('pending')) {
    return res.status(400).json({
      message: "Attendance has already been requested"
    })
  }
  // if currentUser is already accepted
  if (attendance.includes('attending')) {
    return res.status(400).json({
      message: "User is already an attendee of the event"
    })
  }
  // else 
    // add user.id and event.id with status of pending to Attendance
  const newAttendee = await Attendance.create({
    eventId: eventId,
    userId: user.id,
    status: 'pending'
  })

  res.json({
    userId: newAttendee.userId,
    status: newAttendee.status
  })
})

router.post('/:eventId/images', requireAuth, async (req, res) => {
  const { eventId } = req.params
  const { user } = req;
  const { url, preview } = req.body

  const event = await Event.findByPk(eventId)
  if(!event) {
    res.status(404)
    res.json({
      message: "Event couldn't be found"
    })
  }
  const eventObj = event.toJSON()

  const host = await User.findByPk(user.id, {
    include: {
      model: Group,
      where: {
        organizerId: user.id,
        id: eventObj.groupId
      }
    }
  })
  
  const cohost = await User.findByPk(user.id, {
    model: Membership,
    where: {
      groupId: eventObj.groupId,
      status: 'co-host'
    }
  });
  
  const attendee = await Attendance.findAll({
    where: {
      eventId: eventObj.id,
      userId: user.id,
      status: 'attending'
    }
  })

  if (host || cohost || attendee.length) {
    const image = await event.createEventImage({
      url,
      preview
    })

    imageObj = image.toJSON()
    return res.json({
      id: imageObj.id,
      url: imageObj.url,
      preview: imageObj.preview
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.put('/:eventId/attendance', requireAuth, async (req, res) => {
  const { user } = req;
  const { eventId } = req.params;
  const { userId, status } = req.body;
  // Edge case: req.body.status is "pending"
  // 400 "message": "Cannot change an attendance status to pending"
  if (status === 'pending') {
    res.status(400).json({
      message: "Cannot change an attendance status to pending"
    })
  }
  // Edge case: Event don't exist
  // 404 "message": "Event couldn't be found"
  const event = await Event.findByPk(eventId)
  if (!event) {
    res.status(404).json({
      message: "Event couldn't be found"
    })
  }
 // get group
 const group = await Group.findByPk(event.groupId)
 // get currentUser, along with memberships
 const currentUser = await User.findByPk(user.id, {
   include: {
     model: Membership
    }
  })  
  // console.log('group:', group.toJSON())
  // console.log('currentUser:', currentUser.toJSON())
  
  // Edge case: Attendance doesn't exist for req.body userId
  // 404 "message": "Attendance between the user and the event does not exist"
  const reqBodyUser = await User.findByPk(userId, {
    include: {
      model: Attendance
    }
  })

  // get the record of the reqBodyUser that matches this event so we can update it later
  let attending = [];
  reqBodyUser.Attendances.forEach(attendance => {
    // attendance = attendance.toJSON()
    if (attendance.eventId == eventId) {
      attending.push(attendance)
    }
  })
  
  if (!attending.length) {
    return res.status(404).json({
      message: "Attendance between the user and the event does not exist"
    })
  }
  
  // currentUser must be organizer OR be cohost to group
  let cohost = [];
  currentUser.Memberships.forEach(membership => {
    membership = membership.toJSON()
    // if currentUser's membership's groupId matches the event's group
    // and currentUser's membership's status in this group is cohost'
    if (membership.groupId == group.id && membership.status == 'co-host') {
      // console.log(true);
      cohost.push(true)
    }
  })

    // compare if organizer of group OR cohost
      // else FORBIDDEM
  if (group.organizerId === currentUser.id || cohost.length) {
    const updatedAttendance = await attending[0].update({
      userId,
      status
    })
    return res.json(updatedAttendance)
    /* SUCCESS RES
      {
        "id": 1,
        "eventId": 1,
        "userId": 2,
        "status": "attending"
      }
    */
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.put('/:eventId', requireAuth, async (req, res) => {
  const { eventId } = req.params
  const { user } = req;
  const { venueId, name, type, capacity, price, description, startDate, endDate } = req.body

  const venue = await Venue.findByPk(venueId)
  if(!venue) {
    res.status(404)
    res.json({
      message: "Venue couldn't be found"
    })
  }

  const event = await Event.findByPk(eventId)

  if(!event) {
    res.status(404)
    res.json({
      message: "Event couldn't be found"
    })
  }

  const eventObj = event.toJSON()

  const host = await User.findByPk(user.id, {
    include: {
      model: Group,
      where: {
        organizerId: user.id,
        id: eventObj.groupId
      }
    }
  })
  
  const cohost = await User.findByPk(user.id, {
    model: Membership,
    where: {
      groupId: eventObj.groupId,
      status: 'co-host'
    }
  });

  if (host || cohost) {
    await event.update({
      venueId, 
      name, 
      type, 
      capacity, 
      price, 
      description, 
      startDate, 
      endDate
    })

    const updatedEvent = event.toJSON()
    return res.json({
      id: updatedEvent.id,
      groupId: updatedEvent.groupId,
      venueId: updatedEvent.venueId,
      name: updatedEvent.name,
      type: updatedEvent.type,
      capacity: updatedEvent.capacity,
      price: updatedEvent.price,
      description: updatedEvent.description,
      startDate: updatedEvent.startDate,
      endDate: updatedEvent.endDate
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.delete('/:eventId/attendance', requireAuth, async (req, res) => {
  const { user } = req;
  const { eventId } = req.params;
  const { userId } = req.body
  // REQUIRE AUTHORIZATION - currentUser must be organizer or the user whose attendance is being deleted

  // ERROR 404 Event doesn't exist
  const event = await Event.findByPk(eventId)
  if (!event) {
    res.status(404).json({
      message: "Event couldn't be found"
    })
  }
  const reqBodyUser = await User.findByPk(userId, {
    include: {
      model: Attendance
    }
  })
  
  // get the record of the reqBodyUser that matches this event so we can update it later
  let attending = [];
  reqBodyUser.Attendances.forEach(attendance => {
    // attendance = attendance.toJSON()
    if (attendance.eventId == eventId) {
      attending.push(attendance)
    }
  })
  
  // ERROR 404 attendance doesn't exist
  if (!attending.length) {
    return res.status(404).json({
      message: "Attendance between the user and the event does not exist"
    })
  }


  // ERROR 403 Only user or organizer may delete attendance
  //"message": "Only the User or organizer may delete an Attendance"

  // const currentUser = await User.findByPk(user.id, {
  //   include: {
  //     model: Membership
  //    }
  //  })
  const group = await Group.findByPk(event.groupId)

   // check if the currentUser IS the reqBodyUser
  if (user.id === group.organizerId || user.id === userId) {
    await attending[0].destroy()

    // SUCCESS "message": "Successfully deleted attendance from event"
    return res.json({
      message: "Successfully deleted attendance from event"
    })
  } else {
    res.status(403);
    return res.json({
      message: "Only the User or organizer may delete an Attendance"
    })
  }
})

router.delete('/:eventId', requireAuth, async (req, res) => {
  const { eventId } = req.params
  const { user } = req;

  const event = await Event.findByPk(eventId)

  if(!event) {
    res.status(404)
    res.json({
      message: "Event couldn't be found"
    })
  }

  const eventObj = event.toJSON()
  console.log(eventObj)
  // console.log(user.toJSON())

  const host = await User.findByPk(user.id, {
    include: {
      model: Group,
      where: {
        organizerId: user.id,
        id: eventObj.groupId
      }
    }
  })

  const cohost = await User.findByPk(user.id, {
    model: Membership,
    where: {
      groupId: eventObj.groupId,
      status: 'co-host'
    }
  });

  // console.log(host.toJSON())
  // console.log(cohost.toJSON())

  if (host || cohost) {
    await event.destroy()

    return res.json({
      message: "Successfully deleted"
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})


module.exports = router;