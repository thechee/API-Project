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
    .withMessage("Latitude is not valid"),
  check('lng')
    .exists({ checkFalsy: true })
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
    res.json(
      { message: "Venue couldn't be found" }
    )
  }
  const venueObj = venue.toJSON();

  const cohost = await User.findByPk(user.id, {
    include: {
      model: Membership,
      attributes: ['groupId', 'status'],
      where: {
        groupId: venue.groupId,
        status: 'co-host'
      }
    }
  });

  if (venue.Group.organizerId === user.id || cohost !== null) {
    await venue.update({
      address,
      city,
      state,
      lat,
      lng
    });

    delete venueObj.updatedAt;
    delete venueObj.createdAt;
    delete venueObj.Group;
    
    res.json(venueObj)
  } else {
    res.status(403);
    res.json({
      message: "Forbidden"
    })
  }
})

module.exports = router;