const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const validateGroupData = [
  check('name')
    .exists({ checkFalsy: true })
    .withMessage("Name must be 60 characters or less"),
  check('about')
    .exists({ checkFalsy: true })
    .withMessage("About must be 50 characters or more"),
  check('type')
    .exists({ checkFalsy: true })
    .withMessage("Type most be 'Online' of 'In person"),
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


router.get('/current', requireAuth, async (req, res) => {
  const { user } = req

  const groups = await Group.findAll({
    where: {
      organizerId: user.id
    },
    include: [
      {
        model: GroupImage,
        attributes: ['url'],
        where: {
          preview: true
        }
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
    if (group.GroupImages[0]) {
      group.previewImage = group.GroupImages[0].url;
    }
    delete group.GroupImages
    group.numMembers = group.numMembers.length
  })

  res.json({
    Groups: groupsList
  })
})

router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params

  let group = await Group.findByPk(groupId, {
    include: [
      {
        model: User,
        as: 'numMembers'
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
    res.json(
      { message: "Group couldn't be found" }
    )
  }
  group = group.toJSON()
  group.numMembers = group.numMembers.length
  // group.Organizer = group.User
  // delete group.User

  res.json(group)
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
    if (group.GroupImages.length) {
      for (let i = 0; i < group.GroupImages.length; i++) {
        console.log(group.GroupImages)
        if (group.GroupImages[i].preview === true) {
          group.previewImage = group.GroupImages[i].url
          break;
        }
      }
    }
    delete group.GroupImages
    group.numMembers = group.numMembers.length
  })

  res.json({
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
    res.json({
      id: newImage.id,
      url: newImage.url,
      preview: newImage.preview
    })
  } else {
    res.status(403);
    res.json({
      message: "Forbidden"
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
  res.json(newGroup)
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
    
    group = group.toJSON()
    group.name = name;
    group.about = about;
    group.type = type;
    group.private = private;
    group.city = city;
    group.state = state;

    res.json(group)
  } else {
    res.status(403);
    res.json({
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

    res.json({
      message: "Successfully deleted"
    })
  } else {
    res.status(403);
    res.json({
      message: "Forbidden"
    })
  }
})

module.exports = router;