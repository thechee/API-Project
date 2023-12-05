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
      },
      get: function() {
        let year = this.getDataValue('startDate').getFullYear()
        let month = this.getDataValue('startDate').getMonth() + 1
        let day = this.getDataValue('startDate').getDate()

        let time = this.getDataValue('startDate').toLocaleTimeString('en-GB')
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${time}`
      }
    },
    endDate: {
      type: DataTypes.DATE,
      validate: {
        isDate: true,
      },
      get: function() {
        let year = this.getDataValue('endDate').getFullYear()
        let month = this.getDataValue('endDate').getMonth() + 1
        let day = this.getDataValue('endDate').getDate()

        let time = this.getDataValue('endDate').toLocaleTimeString('en-GB')
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${time}`
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