const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue, Event, EventImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');

const validateGroupData = [
  check('name')
    .exists({ checkFalsy: true })
    .isLength({ max: 60 })
    .withMessage("Name must be 60 characters or less"),
  check('about')
    .exists({ checkFalsy: true })
    .isLength({ min: 50 })
    .withMessage("About must be 50 characters or more"),
  check('type')
    .exists({ checkFalsy: true })
    .isIn(['Online', 'In person'])
    .withMessage("Type must be 'Online' or 'In person"),
  check('private')
    .exists()
    .isBoolean()
    .withMessage("Private must be a boolean"),
  check('city')
    .exists({ checkFalsy: true })
    .withMessage("City is required"),
  check('state')
    .exists({ checkFalsy: true })
    .withMessage("State is required"),
  handleValidationErrors
]
const validateVenueData = [
  check('address')
    .exists({ checkFalsy: true })
    .withMessage("Stress address is required"),
  check('city')
    .exists({ checkFalsy: true })
    .withMessage("City is required"),
  check('state')
    .exists({ checkFalsy: true })
    .withMessage("State is required"),
  check('lat')
    .exists({ checkFalsy: true })
    .isFloat({ max: 90, min: -90 })
    .withMessage("Latitude is not valid"),
  check('lng')
    .exists({ checkFalsy: true })
    .isFloat({ max: 180, min: -180 })
    .withMessage("Longitude is not valid"),
  handleValidationErrors
]
const validateEventData = [
  check('venueId')
    .exists({ checkFalsy: true })
    .withMessage("Venue does not exist"),
  check('name')
    .exists({ checkFalsy: true })
    .isLength({ min: 5 })
    .withMessage("Name must be at least 5 characters"),
  check('type')
    .exists({ checkFalsy: true })
    .isIn(['Online', 'In person'])
    .withMessage("Type must be Online or In person"),
  check('capacity')
    .exists({ checkFalsy: true })
    .isInt()
    .withMessage("Capacity must be an integer"),
  check('price')
    .exists({ checkFalsy: true })
    .custom((value) => {
      value = value.toFixed(2);
      if(value.toString().split('.')[1].length > 2) {
        throw new Error("Price is invalid")
      }
      return true;
    })
    .withMessage("Price is invalid"),
  check('description')
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check('startDate')
    .exists({ checkFalsy: true })
    .toDate()
    .custom(value => {
      let enteredDate = new Date(value);
      let todaysDate = new Date();
      if (enteredDate <= todaysDate) {
        throw new Error("Start date must be in the future")
      }
      return true;
    })
    .withMessage("Start date must be in the future"),
  check('endDate')
    .exists({ checkFalsy: true })
    .toDate()
    .custom((endDate, { req }) => {
      if (endDate.getTime() < req.body.startDate.getTime()) {
        throw new Error("End date is less than start date")
      }
      return true;
    })
    .withMessage("End date is less than start date"),
  handleValidationErrors
]

router.get('/current', requireAuth, async (req, res) => {
  const { user } = req

  const ownedGroups = await Group.findAll({
    where: {
      organizerId: user.id
    }
  })

  const groups = await Group.findAll({
    include: { 
      model: User,
      where: {
        id: user.id,
      }
    }
  })

  const groupIds = new Set()
  groups.forEach(group => {
    groupIds.add(group.id)
  })
  ownedGroups.forEach(group => {
    groupIds.add(group.id)
  })  

  // Get all the groups with the ids the user is associated with
  const allGroups = await Group.findAll({
    where: {
        id: {
            [Op.in]: [...groupIds]
        }
    },
    include: [
      {
        model: User
      },
      {
        model: GroupImage
      }
    ]
  });

  let groupsList = [];

  allGroups.forEach(group => {
    groupsList.push(group.toJSON())
  })

  groupsList.forEach(group => {
    if (group.GroupImages[0]) {
      group.previewImage = group.GroupImages[0].url;
    } else {
      group.previewImage = 'No preview available';
    }
    delete group.GroupImages;
    group.numMembers = group.Users.length;
    delete group.Users;
  })

  return res.json({
    Groups: groupsList
  })
})

router.get('/:groupId/venues', requireAuth, async (req, res) => {
  const { groupId } = req.params
  const { user } = req;
  
  const group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json(
      { message: "Group couldn't be found" }
    )
  }

  const cohost = await User.findByPk(user.id, {
    include: {
      model: Membership,
      where: {
        groupId,
        status: 'co-host'
      }
    }
  })

  if (group.organizerId == user.id || cohost !== null) {
    const venues = await Venue.findAll({
      where: {
        groupId
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    })
    return res.json({
      Venues: venues
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.get('/:groupId/events', async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findByPk(groupId)

  if (!group) {
    res.status(404);
    return res.json(
      { message: "Group couldn't be found" }
    )
  }

  const events = await Event.findAll({
    where: {
      groupId
    },
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
  return res.json({
    Events: eventList
  });
})

router.get('/:groupId/members', async (req, res) => {
  const { user } = req;
  const { groupId } = req.params;

  const group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json(
      { message: "Group couldn't be found" }
    )
  }

  const members = await Group.findByPk(groupId, {
    include: {
      model: User,
      attributes: ['id', 'firstName', 'lastName']
    }
  })

  const membersArr = members.toJSON().Users
  const memberIds = new Set()
  membersArr.forEach(member => {
    memberIds.add(member.id)
  })

  const cohost = await User.findByPk(user.id, {
    include: {
      model: Membership,
      where: {
        groupId,
        status: 'co-host'
      }
    }
  })
  /*** CHECK IF CURRENTUSER IS COHOST AS WELL ***/

  let memberships;
  if (user.id === group.organizerId || cohost) {
    memberships = await Membership.findAll({
      where: {
        groupId,
        userId: {
          [Op.in]: [...memberIds]
        }
      },
      attributes: ['status']
    })
    for (let i = 0; i < membersArr.length; i++) {
      delete membersArr[i].Memberships
      membersArr[i].Membership = memberships[i]
    }
    return res.json({
      Members: membersArr
    })
  } else {
    memberships = await Membership.findAll({
      where: {
        groupId,
        userId: {
          [Op.in]: [...memberIds]
        },
        status: {
          [Op.in]: ['co-host', 'member']
        }
      },
      attributes: ['status']
    })

    let notPendingMembers = []
    for (let i = 0; i < membersArr.length; i++) {
      delete membersArr[i].Memberships
      membersArr[i].Membership = memberships[i]
      if (membersArr[i].Membership !== undefined) {
        notPendingMembers.push(membersArr[i])
      }
    }
    // console.log(notPendingMembers)
    return res.json({
      Members: notPendingMembers
    })
  }
})

router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params

  let group = await Group.findByPk(groupId, {
    include: [
      {
        model: User,
      },
      {
        model: GroupImage,
        attributes: {
          exclude: ['groupId', 'createdAt', 'updatedAt']
        }
      },
      {
        model: User,
        as: 'Organizer',
        attributes: {
          exclude: ['username', 'email', 'hashedPassword' ,'createdAt', 'updatedAt']
        }
      },
      {
        model: Venue,
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        }
      }
    ]
  })

  if (!group) {
    res.status(404);
    return res.json(
      { message: "Group couldn't be found" }
    )
  }
  group = group.toJSON()
  group.numMembers = group.Users.length
  delete group.Users
  // group.Organizer = group.User
  // delete group.User

  return res.json(group)
})

router.get('/', async (req, res) => {
  const groups = await Group.findAll(
    {
    include: [
      {
        model: GroupImage,
        attributes: ['url', 'preview']
      }, 
      {
        model: User
      }
    ]
  })

  let groupsList = [];
  groups.forEach(group => {
    groupsList.push(group.toJSON())
  })

  groupsList.forEach(group => {
    if (group.GroupImages?.length) {
      for (let i = 0; i < group.GroupImages.length; i++) {
        if (group.GroupImages[i].preview === true) {
          group.previewImage = group.GroupImages[i].url
          break;
        }
      }
    }
    delete group.GroupImages
    group.numMembers = group.Users.length
    delete group.Users
  })

  return res.json({
    Groups: groupsList
  })
})

router.post('/:groupId/images', requireAuth, async (req, res) => {
  const { user } = req;
  const { groupId } = req.params;
  const { url, preview } = req.body;

  const group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json({
        message: "Group couldn't be found"
    })
  }

  if (user.id === group.organizerId) {
    let newImage = await group.createGroupImage({
      url,
      preview
    })
    newImage = newImage.toJSON()
    return res.json({
      id: newImage.id,
      url: newImage.url,
      preview: newImage.preview
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.post('/:groupId/venues', requireAuth, validateVenueData, async (req, res) => {
  const { groupId } = req.params
  const { user } = req;
  const { address, city, state, lat, lng } = req.body;
  
  const group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json(
      { message: "Group couldn't be found" }
    )
  }

  const cohost = await User.findByPk(user.id, {
    include: {
      model: Membership,
      where: {
        groupId,
        status: 'co-host'
      }
    }
  })

  if (group.organizerId === user.id || cohost !== null) {
    const newVenue = await group.createVenue({
      address,
      city,
      state,
      lat,
      lng
    })

    let newVenueObj = newVenue.toJSON()
    delete newVenueObj.updatedAt
    delete newVenueObj.createdAt
    
    res.json(newVenueObj)
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.post('/:groupId/events', requireAuth, validateEventData, async (req, res) => {
  const { groupId } = req.params
  const { user } = req;
  let { venueId, name, type, capacity, price, description, startDate, endDate } = req.body;

  const group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404)
    return res.json({
      message: "Group couldn't be found"
    })
  }

  // find if organizer
  const cohost = await User.findByPk(user.id, {
    include: {
      model: Membership,
      where: {
        groupId,
        status: 'co-host'
      }
    }
  })

  if (group.organizerId == user.id || cohost !== null) {
    const newEvent = await group.createEvent({
      venueId,
      name,
      type,
      capacity,
      price,
      description,
      startDate,
      endDate
    })

    newEventObj = newEvent.toJSON()
    delete newEventObj.updatedAt
    delete newEventObj.createdAt

    return res.json(newEventObj)
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.post('/:groupId/membership', requireAuth, async (req, res) => {
  const { user } = req;
  const { groupId } = req.params;

  const group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json(
      { message: "Group couldn't be found" }
    )
  }
  const userStatus = await Membership.findOne({
    where: {
      groupId,
      userId: user.id
    }
  })
  // console.log(userStatus.toJSON())

  if (!userStatus) {
    const newMembership = await group.createMembership({
      userId: user.id,
      status: 'pending'
    })

    const newMemberObj = newMembership.toJSON()
    newMemberObj.memberId = newMemberObj.userId
    return res.json({
      memberId: newMemberObj.memberId,
      status: newMemberObj.status
    })
  } else if (userStatus.toJSON().status === 'pending') {
    res.status(400)
    return res.json({
      message: "Membership has already been requested"
    })
  } else if (userStatus.toJSON().status !== 'pending') {
    res.status(400)
    return res.json({
      message: "User is already a member of the group"
    })
  }
})

router.post('/', requireAuth, validateGroupData, async (req, res) => {
  const { name, about, type, private, city, state} = req.body
  const user = await User.findByPk(req.user.id)

  const newGroup = await user.createGroup({
    name,
    about,
    type,
    private,
    city,
    state
  })

  res.status(201);
  return res.json(newGroup)
})

router.put('/:groupId/membership', requireAuth, async (req, res) => {
  const { user } = req;
  const { groupId } = req.params;
  const { memberId, status } = req.body

  // cannot change status to pending
  if (status == 'pending') {
    return res.status(400).json({
      message: "Validations Error",
      errors: {
        status : "Cannot change a membership status to pending"
      }
    })
  }

  // find the group
  const group = await Group.findByPk(groupId)
  // group must exist
  if (!group) {
    res.status(404)
    return res.json({
      message: "Group couldn't be found"
    })
  }
  
  // find if the member exists at all in any group
  const userExists = await User.findByPk(memberId)

  // member must at least exist somewhere
  if (!userExists) {
    return res.status(400).json({
      message: "Validation Error",
      errors: {
        memberId: "User couldn't be found"
      }
    })
  }


  // find if member has a membership with the group
  const membership = await Membership.findOne({
    where: {
      userId: memberId,
      groupId
    }
  })
  // member must already have a membership with the group
  if (!membership) {
    res.status(404)
    return res.json({
      message: "Membership between the user and the group does not exist"
    })
  }

  // check if the current logged in user is a cohost or member of the group
  const cohost = await Membership.findOne({
    where: {
      userId: user.id,
      groupId,
      status: 'co-host'
    }
  })

  // if (!userMembership) {
  //   res.status(403);
  //   return res.json({
  //     message: "Forbidden"
  //   })
  // }
  
  let newStatus;
  // if user is organizer
  if (user.id == group.organizerId) {
    // can change status from to member or co-host
    newStatus = await membership.update({
      status: status
    })
    return res.json(newStatus)
    // if user is co-host
  } else if (cohost && status == 'member') {
    // console.log(cohost.toJSON())
    newStatus = await membership.update({
      status: status
    })
    return res.json(newStatus)
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.put('/:groupId', requireAuth, validateGroupData, async (req, res) => {
  const { user } = req;
  const { groupId } = req.params;
  const { name, about, type, private, city, state} = req.body

  let group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json(
      {
        message: "Group couldn't be found"
      }
    )
  }

  if (user.id === group.organizerId) {

    await group.update({
      name,
      about,
      type,
      private,
      city,
      state
    })

    return res.json(group)
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.delete('/:groupId/membership', requireAuth, async (req, res) => {
  const { user } = req;
  const { memberId } = req.body;
  const { groupId } = req.params;

  // find the group
  const group = await Group.findByPk(groupId)
  // group must exist
  if (!group) {
    res.status(404)
    return res.json({
      message: "Group couldn't be found"
    })
  }

  const userExists = await User.findByPk(memberId)
  
  if (!userExists) {
    return res.status(400).json({
      message: "Validation Error",
      errors: {
        memberId: "User couldn't be found"
      }
    })
  }

  // find if member has a membership with the group
  const membership = await Membership.findOne({
    where: {
      userId: {
        [Op.in]: [memberId, user.id]
      },
      groupId
    }
  })
  // member must already have a membership with the group
  if (!membership) {
    res.status(404)
    return res.json({
      message: "Membership does not exist for this User"
    })
  }
 
  // if current user is organizer of group OR is the memberID being deleted
  if (user.id == group.organizerId || user.id === memberId) {
    await membership.destroy()
    return res.json({
      message: "Successfully deleted membership from group"
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

router.delete('/:groupId', requireAuth, async (req, res) => {
  const { user } = req;
  const { groupId } = req.params;

  let group = await Group.findByPk(groupId)
  if (!group) {
    res.status(404);
    return res.json(
      {
        message: "Group couldn't be found"
      }
    )
  }

  if (user.id === group.organizerId) {

    await group.destroy()

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