const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue, Event, EventImage, Attendance } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

router.get('/', async (req, res) => {
  const events = await Event.findAll({
    attributes: {
      exclude: ['price', 'capacity', 'description']
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
  res.json({
    Events: eventList
  });
})

module.exports = router;