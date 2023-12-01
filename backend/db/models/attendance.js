'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
   
    static associate(models) {
      // define association here
    }
  }
  Attendance.init({
    eventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Events'
      },
      onDelete: 'CASCADE',
      hooks: true
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users'
      },
      onDelete: 'CASCADE',
      hooks: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidType(value) {
          const validTypes = ['attending', 'waitlist', 'pending'];
          if (!validTypes.includes(value)) {
            throw new Error("Status must be attending, waitlist, or pending'")
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Attendance',
  });
  return Attendance;
};