const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')

router.delete('/:imageId', requireAuth, async (req, res) => {
  const { user } = req;
  const { imageId } = req.params;

  const image = await GroupImage.findByPk(imageId, {
    include: {
      model: Group
    }
  })
  if (!image) {
    return res.status(404).json({
      message: "Group Image couldn't be found"
    })
  }

  const currentUser = await User.findByPk(user.id, {
    include: [{
      model: Group
    },
    {
      model: Membership
    }
    ]
  })

  let organizer = image.Group.organizerId == user.id
  // console.log(image.toJSON())
  // console.log(currentUser.toJSON())
  
  let cohost = []
  // let cohost = currentUser.Memberships == 

  currentUser.Memberships.forEach(membership => {
    membership = membership.toJSON()
    // if currentUser's membership's groupId matches the event's group
    // and currentUser's membership's status in this group is cohost'
    if (membership.groupId === image.Group.id && membership.status == 'co-host') {
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