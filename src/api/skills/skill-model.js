const { DataTypes } = require('sequelize');
const SkillType = require('../../constants/skill-type');

module.exports = (sequelize) => {
  const Skill = sequelize.define(
    'Skill',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(SkillType)),
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'skills',
      timestamps: true,
    }
  );

  return Skill;
};
