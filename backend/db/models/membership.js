'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Membership extends Model {

    static associate(models) {
      // define association here

      Membership.belongsTo(models.Group, {
        foreignKey: 'groupId'
      })

      Membership.belongsTo(models.User, {
        foreignKey: 'userId'
      })
    }
  }
  Membership.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users'
      },
      allowNull: false,
      onDelete: 'CASCADE',
      hooks: true
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidType(value) {
          const validTypes = ['co-host', 'member', 'pending'];
          if (!validTypes.includes(value)) {
            throw new Error("Status must be co-host, member, or pending'")
          }
        },
        notToPending(value) {
          if (value == 'pending' && (this.status == 'member' || this.status == 'co-host')) {
            throw new Error('Cannot change a membership status to pending')
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Membership',
  });
  return Membership;
};