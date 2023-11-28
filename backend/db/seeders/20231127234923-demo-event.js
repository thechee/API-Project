'use strict';

const { Event } = require('../models')

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Event.bulkCreate([
      {
        venueId: 1,
        groupId: 1,
        name: 'Memorial Day Mayhem',
        type: 'In person',
        capacity: 500,
        price: 10.00,
        description: 'The official opening day of grilling season!!',
        startDate: "2024-05-30 12:00:00",
        endDate: "2024-05-30 20:00:00"
      },
      {
        venueId: 2,
        groupId: 2,
        name: 'Cat Chat',
        type: 'Online',
        capacity: 1000,
        price: 2.00,
        description: 'Monthly cat chat, BYOB',
        startDate: "2024-01-30 12:00:00",
        endDate: "2024-01-30 20:00:00"
      },
      {
        venueId: 3,
        groupId: 3,
        name: 'New Exhibit Snobbery',
        type: 'In person',
        capacity: 5,
        price: 100.00,
        description: 'There is a new exhibit at the museum, we are going to make fun of it',
        startDate: "2024-07-30 12:00:00",
        endDate: "2024-07-30 20:00:00"
      },
      {
        venueId: 4,
        groupId: 1,
        name: 'JULY 4th MUERICA DAY',
        type: 'In person',
        capacity: 500,
        price: 10.00,
        description: 'LET THERE BE HOT DOGS AND FREEDOM',
        startDate: "2024-07-04 12:00:00",
        endDate: "2024-07-04 20:00:00"
      },
      {
        venueId: 1,
        groupId: 2,
        name: 'Cat Chat',
        type: 'Online',
        capacity: 1000,
        price: 2.00,
        description: 'Monthly cat chat, BYOB',
        startDate: "2024-02-27 12:00:00",
        endDate: "2024-02-27 20:00:00"
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Events';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      groupId: { [Op.in]: [1, 2, 3]}
    }, {});
  }
};
