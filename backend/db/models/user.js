
'use strict';
const {
  Model,
  Validator
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
  
    static associate(models) {
      // define association here
      User.hasMany(models.Group, {
        foreignKey: 'organizerId',
        onDelete: 'CASCADE',
        hooks: true
      })
      
      User.belongsToMany(models.Event, {
        through: 'Attendance',
        foreignKey: 'userId',
        otherKey: 'eventId'
      })

      User.belongsToMany(models.Group, {
        through: 'Membership',
        foreignKey: 'userId',
        otherKey: 'groupId',
      })

      User.hasMany(models.Membership, {
        foreignKey: 'userId'
      })

      User.hasMany(models.Attendance, {
        foreignKey: 'userId'
      })
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [4, 30],
        isNotEmail(value) {
          if (Validator.isEmail(value)) {
            throw new Error('Cannot be an email')
          }
        }
      }
    },
    firstName: {
      type: DataTypes.STRING,
      validate: {
        isAlpha: true
      },
      // allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      validate: {
        isAlpha: true
      },
      // allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 256],
        isEmail: true
      }
      },
    hashedPassword: {
      type: DataTypes.STRING.BINARY,
      allowNull: false,
      validate: {
        len: [60, 60]
      }
    }  
  }, {
    sequelize,
    modelName: 'User',
    defaultScope: {
      attributes: {
        exclude: ['hashedPassword', 'email', 'createdAt', 'updatedAt']
      }
    }
  });
  return User;
};