const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue, Event, EventImage, Attendance } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')

router.delete('/:imageId', requireAuth, async (req, res) => {
  const { user } = req;
  const { imageId } = req.params;

  const image = await EventImage.findByPk(imageId, {
    include: {
      model: Event
    }
  })
  if (!image) {
    return res.status(404).json({
      message: "Event Image couldn't be found"
    })
  }

  const group =  await Group.findByPk(image.Event.groupId)

  const currentUser = await User.findByPk(user.id, {
    include: [{
      model: Group
    },
    {
      model: Membership
    }
    ]
  })

  // console.log(image.toJSON())
  // console.log(group.toJSON())
  // console.log(currentUser.toJSON())
  
  // check if currentUser is the organizer of the Group of the Event
  let organizer = group.organizerId == currentUser.id
  // let cohost = currentUser.Memberships == 
  
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

  // if currentUser is organizer OR cohost
  if (organizer || cohost.length) {
    await image.destroy()

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