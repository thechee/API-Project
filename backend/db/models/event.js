'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {

    static associate(models) {
      // define association here
      Event.belongsTo(models.Venue, {
        foreignKey: 'venueId'
      })

      Event.belongsTo(models.Group, {
        foreignKey: 'groupId',
      })

      Event.hasMany(models.EventImage, {
        foreignKey: 'eventId',
        onDelete: 'CASCADE',
        hooks: true
      })

      Event.belongsToMany(models.User, {
        through: 'Attendance',
        foreignKey: 'eventId',
        otherKey: 'userId',
        as: 'numAttending'
      })
    }
  }
  Event.init({
    venueId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Venues'
      },
      onDelete: 'SET NULL',
    },
    groupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups'
      },
      allowNull: false,
      onDelete: 'CASCADE',
      hooks: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidType(value) {
          const validTypes = ['In person', 'Online'];
          if (!validTypes.includes(value)) {
            throw new Error("Type must be 'Online' or 'In person'")
          }
        }
      }
    },
    capacity: {
      type: DataTypes.INTEGER
    },
    price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    startDate: {
      type: DataTypes.DATE,
      validate: {
        isDate: true,
        isAfter: new Date().toJSON().slice(0, 10)
      }
    },
    endDate: {
      type: DataTypes.DATE,
      validate: {
        // notBeforeStartDate(value) {
        //   if (value < this.startDate) {
        //     throw new Error('End date cannot be before the start date')
        //   }
        // }
        isDate: true,
      }
    }
  }, {
    sequelize,
    modelName: 'Event',
    defaultScope: {
      attributes: {
        exclude: ['price', 'capacity', 'description', 'createdAt', 'updatedAt']
      }
    }
  });
  return Event;
};