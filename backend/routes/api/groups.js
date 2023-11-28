const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')


router.get('/current', requireAuth, async (req, res) => {
  const user = req.user
  console.log(user)

  const groups = await Group.findAll({
    where: {
      organizerId: user.id
    },
    include: [
      {
        model: GroupImage,
        as: 'previewImage',
        attributes: ['url']
      }, 
      {
        model: User,
        as: 'numMembers'
      }
    ]
  })
  
  let groupsList = [];
  groups.forEach(group => {
    groupsList.push(group.toJSON())
  })

  groupsList.forEach(group => {
    group.previewImage = group.previewImage[0].url
    group.numMembers = group.numMembers.length
  })

  res.json({
    Groups: groupsList
  })
})

router.get('/', async (req, res) => {
  const groups = await Group.findAll(
    {
    include: [
      {
        model: GroupImage,
        as: 'previewImage',
        attributes: ['url']
      }, 
      {
        model: User,
        as: 'numMembers'
      }
    ]
  })

  let groupsList = [];
  groups.forEach(group => {
    groupsList.push(group.toJSON())
  })

  groupsList.forEach(group => {
    group.previewImage = group.previewImage[0].url
    group.numMembers = group.numMembers.length
  })

  res.json({
    Groups: groupsList
  })
})

module.exports = router;