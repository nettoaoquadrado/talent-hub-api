const { DataTypes } = require('sequelize');
const JobApplicationStatus = require('../../constants/job-application-status');

module.exports = (sequelize) => {
  const JobApplicationFeedback = sequelize.define(
    'JobApplicationFeedback',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      jobApplicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'job_applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(JobApplicationStatus)),
        allowNull: false,
        comment: 'Status para o qual a candidatura foi atualizada (feedback associado a essa transição)',
        validate: {
          isIn: [Object.values(JobApplicationStatus)],
        },
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'job_application_feedbacks',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['job_application_id'],
        },
      ],
    }
  );

  return JobApplicationFeedback;
};
