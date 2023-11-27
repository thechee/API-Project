'use strict';

const { GroupImage } = require('../models')

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await GroupImage.bulkCreate([
      {
        groupId: 1,
        url: 'image url',
        preview: true
      },
      {
        groupId: 2,
        url: 'image url',
        preview: true
      },
      {
        groupId: 3,
        url: 'image url',
        preview: false
      },
      {
        groupId: 1,
        url: 'image url',
        preview: false
      },
      {
        groupId: 2,
        url: 'image url',
        preview: false
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'GroupImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      groupId: { [Op.in]: [1, 2, 3]}
    }, {});
  }
};
