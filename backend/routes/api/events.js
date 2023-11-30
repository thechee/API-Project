const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue, Event, EventImage, Attendance } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

router.get('/', async (req, res) => {
  const events = await Event.findAll({
    include: [
      {
        model: EventImage,
        attributes: ['url'],
        where: {
          preview: true
        }
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
  
  // console.log('event: ', event.toJSON())
  // console.log(host)
  // console.log(cohost)
  // console.log(attendee.length)

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