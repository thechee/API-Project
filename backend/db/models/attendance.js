'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Attendance.init({
    eventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Events'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users'
      }
    },
    status: DataTypes.ENUM('attending', 'waitlist', 'pending')
  }, {
    sequelize,
    modelName: 'Attendance',
  });
  return Attendance;
};