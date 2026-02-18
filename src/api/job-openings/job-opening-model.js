const { DataTypes } = require('sequelize');
const JobOpeningStatus = require('../../constants/job-opening-status');
const WorkModel = require('../../constants/work-model');
const ContractType = require('../../constants/contract-type');
const DegreeType = require('../../constants/degree-type');
const Seniority = require('../../constants/seniority');
const Benefit = require('../../constants/benefit');

module.exports = (sequelize) => {
  const JobOpening = sequelize.define(
    'JobOpening',
    {
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id',
        },
      },
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      acceptAutoApply: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      requirements: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      requiredSkills: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: true,
      },
      salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      addressStreet: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressComplement: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressNeighborhood: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressZipCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(JobOpeningStatus)),
        allowNull: false,
        defaultValue: JobOpeningStatus.OPEN,
      },
      workModel: {
        type: DataTypes.ENUM(...Object.values(WorkModel)),
        allowNull: true,
      },
      contractType: {
        type: DataTypes.ENUM(...Object.values(ContractType)),
        allowNull: true,
      },
      degreeType: {
        type: DataTypes.ENUM(...Object.values(DegreeType)),
        allowNull: true,
      },
      seniority: {
        type: DataTypes.ENUM(...Object.values(Seniority)),
        allowNull: true,
      },
      minExperience: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      minAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      requireCompleteGraduation: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      availableForReaddress: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      benefits: {
        type: DataTypes.ARRAY(DataTypes.ENUM(...Object.values(Benefit))),
        allowNull: true,
      },
      otherBenefits: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      salaryMin: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      salaryMax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
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
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'job_openings',
    }
  );

  return JobOpening;
};
