'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Group.belongsTo(models.User, {
        as: 'Organizer',
        foreignKey: 'organizerId'
      })

      Group.hasMany(models.Event, {
        foreignKey: 'groupId'
      })

      Group.hasMany(models.GroupImage, {
        foreignKey: 'groupId'
      })

      Group.hasMany(models.Venue, {
        foreignKey: 'groupId'
      })

      Group.hasMany(models.Membership, {
        foreignKey: 'groupId'
      })
    }
  }
  Group.init({
    organizerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users'
      },
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        lessThan60(value) {
          if (value.length > 60) {
            throw new Error("Name must be 60 characters or less")
          }
        }
      }
    },
    about: {
      type: DataTypes.TEXT,
      validate: {
        longerThan50(value) {
          if (value.length < 50) {
            throw new Error("About must be 50 characters or more")
          }
        }
      }
    },
    type: {
      type: DataTypes.STRING,
      validate: {
        isValidType(value) {
          const validTypes = ['In person', 'Online'];
          if (!validTypes.includes(value)) {
            throw new Error("Type must be 'Online' or 'In person'")
          }
        }
      }
    },
    private: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false  
    }
   }, {
    sequelize,
    modelName: 'Group',
  });
  return Group;
};