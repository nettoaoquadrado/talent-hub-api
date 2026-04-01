const { DataTypes } = require('sequelize');
const JobApplicationStatus = require('../../constants/job-application-status');

module.exports = (sequelize) => {
  const JobApplication = sequelize.define(
    'JobApplication',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      jobId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'job_openings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(JobApplicationStatus)),
        allowNull: false,
        defaultValue: JobApplicationStatus.APPLIED,
        validate: {
          isIn: [Object.values(JobApplicationStatus)],
        },
      },
      coverLetter: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      finalScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Score 0-100 calculado por regras + IA',
      },
      scoreBreakdown: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '{ skillsMatch, educationMatch, locationMatch, salaryMatch }',
      },
      aiInsights: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Texto gerado por modelo local (ex: Ollama)',
      },
      isAutoApply: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica se a candidatura foi criada automaticamente pelo worker de auto-aplicação',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'job_applications',
      paranoid: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['job_id', 'student_id'],
        },
        {
          fields: ['job_id'],
        },
        {
          fields: ['student_id'],
        },
        {
          fields: ['status'],
        },
      ],
    }
  );

  return JobApplication;
};
