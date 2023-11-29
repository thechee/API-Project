'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

const { Membership } = require('../models')
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Membership.bulkCreate([
      {
        userId: 1,
        groupId: 1,
        status: 'co-host'
      },
      {
        userId: 1,
        groupId: 2,
        status: 'co-host'
      },
      {
        userId: 2,
        groupId: 3,
        status: 'co-host'
      },
      {
        userId: 3,
        groupId: 1,
        status: 'member'
      },
      {
        userId: 3,
        groupId: 2,
        status: 'member'
      },

    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Memberships';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      userId: { [Op.or]: [1, 2, 3]}
    }, {});
  }
};
