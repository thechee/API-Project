'use strict';

const { Venue } = require('../models')

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Venue.bulkCreate([
      {
        groupId: 1,
        address: '123 Whereever',
        city: 'Omaha',
        state: 'NE',
        lat: 41.15,
        lng: 95.56
      },
      {
        groupId: 2,
        address: '321 Whichever',
        city: 'Seattle',
        state: 'WA',
        lat: 47.36,
        lng: 122.19
      },
      {
        groupId: 3,
        address: '456 Whoever',
        city: 'Memphis',
        state: 'TN',
        lat: 35.01,
        lng: 89.58
      },
      {
        groupId: 2,
        address: '765 Not Real',
        city: 'Corpus Christi',
        state: 'TX',
        lat: 27.44,
        lng: 97.24
      },
      {
        groupId: 3,
        address: '987 Fake As',
        city: 'Provo',
        state: 'UT',
        lat: 40.14,
        lng: 111.39
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Venues';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      groupId: { [Op.in]: [1, 2, 3]}
    }, {});
  }
};
