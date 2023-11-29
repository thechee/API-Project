'use strict';

const { Group } = require('../models')

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Group.bulkCreate([
      {
        organizerId: 1,
        name: 'Grillin Dads',
        about: 'Just a buncha dads who like to get together and fight over manning the grill',
        type: 'In person',
        private: false,
        city: 'Fairbanks',
        state: 'AK'
      },
      {
        organizerId: 1,
        name: 'Cat Lovers',
        about: 'Lets chat about our cats! I need to get this text to be at least 50 characters ',
        type: 'Online',
        private: false,
        city: 'Los Angeles',
        state: 'CA'
      },
      {
        organizerId: 2,
        name: 'Art Snobs',
        about: 'We got to galleries and thumb our noses at everything. We are the snobbiest and coolest.',
        type: 'In person',
        private: true,
        city: 'Milwaukee',
        state: 'WI'
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Groups';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      name: { [Op.in]: ['Grillin Dads', 'Cat Lovers', 'Art Snobs']}
    }, {});
  }
};
