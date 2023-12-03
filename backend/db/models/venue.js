'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Venue extends Model {

    static associate(models) {
      // define association here
      Venue.belongsTo(models.Group, {
        foreignKey: 'groupId'
      })

      Venue.hasMany(models.Event, {
        foreignKey: 'venueId',
        onDelete: 'SET NULL',
        hooks: true
      })
    }
  }
  Venue.init({
    groupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups'
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 2],
        isAlpha: true
      }
    },
    lat: {
      type: DataTypes.FLOAT,
      validate: {
        isWithin90(value) {
          if (Math.abs(value) > 90) {
            throw new Error('Latitude cannot be greater than 90 or less than -90 degrees')
          }
        }
      }
    },
    lng: {
      type: DataTypes.FLOAT,
      validate: {
        isWithin180(value) {
          if (Math.abs(value) > 180) {
            throw new Error('Longitude cannot be greater than 180 or less than -180 degrees')
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Venue',
  });
  return Venue;
};