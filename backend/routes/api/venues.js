const express = require('express');
const router = express.Router();
const { Group, User, Membership, GroupImage, Venue } = require('../../db/models');
const { requireAuth } = require('../../utils/auth')
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

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

router.put('/:venueId', requireAuth, validateVenueData, async (req, res) => {
  const { venueId } = req.params;
  const { user } = req;
  const { address, city, state, lat, lng } = req.body; 
  
  const venue = await Venue.findByPk(venueId, {
    include: {
      model: Group
    }
  })

  if (!venue) {
    res.status(404);
    return res.json(
      { message: "Venue couldn't be found" }
    )
  }

  const cohost = await User.findByPk(user.id, {
    include: {
      model: Membership,
      where: {
        groupId: venue.groupId,
        status: 'co-host'
      }
    }
  });

  if (venue.Group.organizerId === user.id || cohost !== null) {
    const editedVenue = await venue.update({
      address,
      city,
      state,
      lat,
      lng
    });

    const returnVenue = editedVenue.toJSON()

    return res.json({
      id: returnVenue.id,
      groupId: returnVenue.groupId,
      address: returnVenue.address,
      city: returnVenue.city,
      state: returnVenue.state,
      lat: returnVenue.lat,
      lng: returnVenue.lng
    })
  } else {
    res.status(403);
    return res.json({
      message: "Forbidden"
    })
  }
})

module.exports = router;