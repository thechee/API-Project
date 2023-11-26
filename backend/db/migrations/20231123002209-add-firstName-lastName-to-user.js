'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
  options.tableName = 'Users';
}
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn(options, 'firstName', {
        type: Sequelize.STRING
    });

    await queryInterface.addColumn(options, 'lastName', {
        type: Sequelize.STRING
    });
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.removeColumn(options, 'firstName')

    await queryInterface.removeColumn(options, 'lastName')
  }
};
