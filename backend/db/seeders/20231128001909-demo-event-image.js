'use strict';

const { EventImage } = require('../models')

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await EventImage.bulkCreate([
      {
        eventId: 1,
        url: 'image url',
        preview: true
      },
      {
        eventId: 2,
        url: 'image url',
        preview: false
      },
      {
        eventId: 3,
        url: 'image url',
        preview: true
      },
      {
        eventId: 3,
        url: 'image url',
        preview: false
      },
      {
        eventId: 4,
        url: 'image url',
        preview: true
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'EventImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      eventId: { [Op.in]: [1, 2, 3, 4, 5]}
    }, {});
  }
};
