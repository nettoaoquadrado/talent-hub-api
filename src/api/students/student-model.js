const { DataTypes } = require('sequelize');
const DegreeType = require('../../constants/degree-type');
const EducationStatus = require('../../constants/education-status');
const SkillLevel = require('../../constants/skill-level');
const WorkModel = require('../../constants/work-model');
const ContractType = require('../../constants/contract-type');
const Gender = require('../../constants/gender');
const Race = require('../../constants/race');
const GenderExpression = require('../../constants/gender-expression');
const EducationLevel = require('../../constants/education-level');
const Language = require('../../constants/language');
const LanguageProficiency = require('../../constants/language-proficiency');

module.exports = (sequelize) => {
  const Student = sequelize.define(
    'Student',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      progressPercentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      performancePercentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      enrollmentNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAutoApplyEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      headline: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      academicEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      linkedinUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      githubUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      portfolioUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resumeUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profilePictureUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      targetRoles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      salaryExpectationMin: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      workModels: {
        type: DataTypes.ARRAY(DataTypes.ENUM(...Object.values(WorkModel))),
        allowNull: true,
      },
      contractTypes: {
        type: DataTypes.ARRAY(DataTypes.ENUM(...Object.values(ContractType))),
        allowNull: true,
      },
      availableForRelocation: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      availabilityToStart: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM(...Object.values(Gender)),
        allowNull: true,
      },
      race: {
        type: DataTypes.ENUM(...Object.values(Race)),
        allowNull: true,
      },
      genderExpression: {
        type: DataTypes.ENUM(...Object.values(GenderExpression)),
        allowNull: true,
      },
      mainEducationLevel: {
        type: DataTypes.ENUM(...Object.values(EducationLevel)),
        allowNull: true,
      },
      isCurrentlyWorking: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      addressZipCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressStreet: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressNeighborhood: {
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
      addressState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      about: {
        type: DataTypes.TEXT,
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
    },
    {
      tableName: 'students',
      timestamps: true,
    }
  );

  const StudentView = sequelize.define(
    'StudentView',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id',
        },
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      viewedAt: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: 'student_views',
      indexes: [
        {
          fields: ['student_id'],
        },
        {
          fields: ['company_id'],
        },
      ],
      uniqueKeys: [
        {
          fields: ['student_id', 'company_id', 'viewed_at'],
        },
      ],
    }
  );

  const StudentEducation = sequelize.define(
    'StudentEducation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      institution: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      degree: {
        type: DataTypes.ENUM(...Object.values(DegreeType)),
        allowNull: false,
      },
      fieldOfStudy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      expectedGraduationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      currentSemester: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(EducationStatus)),
        allowNull: false,
      },
    },
    {
      tableName: 'student_education',
    }
  );

  const StudentExperience = sequelize.define(
    'StudentExperience',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isCurrentlyWorking: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: 'student_experience',
    }
  );

  const StudentSkill = sequelize.define(
    'StudentSkill',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      skillId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'skills',
          key: 'id',
        },
      },
      level: {
        type: DataTypes.ENUM(...Object.values(SkillLevel)),
        allowNull: true,
      },
    },
    {
      tableName: 'student_skills',
      indexes: [
        {
          fields: ['student_id'],
        },
        {
          fields: ['skill_id'],
        },
      ],
      uniqueKeys: [
        {
          fields: ['student_id', 'skill_id'],
        },
      ],
    }
  );

  const StudentCertification = sequelize.define(
    'StudentCertification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issuingOrganization: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hasExpiration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      expirationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      credentialId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      credentialUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'student_certifications',
    }
  );

  const StudentLanguage = sequelize.define(
    'StudentLanguage',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      language: {
        type: DataTypes.ENUM(...Object.values(Language)),
        allowNull: false,
      },
      proficiency: {
        type: DataTypes.ENUM(...Object.values(LanguageProficiency)),
        allowNull: false,
      },
    },
    {
      tableName: 'student_languages',
      indexes: [
        {
          fields: ['student_id'],
        },
        {
          fields: ['language'],
        },
      ],
      uniqueKeys: [
        {
          fields: ['student_id', 'language'],
        },
      ],
    }
  );

  return {
    Student,
    StudentEducation,
    StudentExperience,
    StudentSkill,
    StudentCertification,
    StudentView,
    StudentLanguage,
  };
};
