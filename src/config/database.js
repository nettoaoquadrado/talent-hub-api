const { Sequelize } = require("sequelize");
const config = require("./config");

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "postgres",
    logging: config.app.env === "development" ? console.log : false,
    define: {
      timestamps: false,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const Company = require("../api/companies/company-model")(sequelize);
const User = require("../api/users/user-model")(sequelize);
const Skill = require("../api/skills/skill-model")(sequelize);
const JobOpening = require("../api/job-openings/job-opening-model")(sequelize);
const JobApplication = require("../api/job-applications/job-application-model")(
  sequelize,
);
const JobApplicationFeedback = require("../api/job-applications/job-application-feedback-model")(
  sequelize,
);

const studentModels = require("../api/students/student-model")(sequelize);
const {
  Student,
  StudentEducation,
  StudentExperience,
  StudentSkill,
  StudentCertification,
  StudentView,
  StudentLanguage,
} = studentModels;

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");

    // --- Associações: Company & JobOpening ---
    Company.hasMany(JobOpening, {
      foreignKey: "companyId",
      as: "jobOpenings",
      onDelete: "CASCADE",
    });
    JobOpening.belongsTo(Company, {
      foreignKey: "companyId",
      as: "company",
    });

    JobOpening.hasMany(JobApplication, {
      foreignKey: "jobId",
      as: "applications",
      onDelete: "CASCADE",
    });
    JobApplication.belongsTo(JobOpening, {
      foreignKey: "jobId",
      as: "jobOpening",
    });

    // --- Associações: Student & JobApplication ---
    Student.hasMany(JobApplication, {
      foreignKey: "studentId",
      as: "applications",
      onDelete: "CASCADE",
    });
    JobApplication.belongsTo(Student, {
      foreignKey: "studentId",
      as: "student",
    });

    // --- JobApplicationFeedback (histórico de feedback por transição de status) ---
    JobApplication.hasMany(JobApplicationFeedback, {
      foreignKey: "jobApplicationId",
      as: "feedbacks",
      onDelete: "CASCADE",
    });
    JobApplicationFeedback.belongsTo(JobApplication, {
      foreignKey: "jobApplicationId",
      as: "jobApplication",
    });

    // 1. Relação direta (Tabela de Junção)
    Student.hasMany(StudentSkill, {
      foreignKey: "studentId",
      as: "skills",
      onDelete: "CASCADE",
    });
    StudentSkill.belongsTo(Student, { foreignKey: "studentId", as: "student" });

    Skill.hasMany(StudentSkill, {
      foreignKey: "skillId",
      as: "studentSkills",
      onDelete: "CASCADE",
    });
    StudentSkill.belongsTo(Skill, { foreignKey: "skillId", as: "skill" });

    // Certificações
    Student.hasMany(StudentCertification, {
      foreignKey: "studentId",
      as: "certifications",
      onDelete: "CASCADE",
    });
    StudentCertification.belongsTo(Student, {
      foreignKey: "studentId",
      as: "student",
    });

    // Educação
    Student.hasMany(StudentEducation, {
      foreignKey: "studentId",
      as: "educations",
      onDelete: "CASCADE",
    });
    StudentEducation.belongsTo(Student, {
      foreignKey: "studentId",
      as: "student",
    });

    // Experiência
    Student.hasMany(StudentExperience, {
      foreignKey: "studentId",
      as: "experiences",
      onDelete: "CASCADE",
    });
    StudentExperience.belongsTo(Student, {
      foreignKey: "studentId",
      as: "student",
    });

    // Idiomas (CandidateLanguage)
    Student.hasMany(StudentLanguage, {
      foreignKey: "studentId",
      as: "languages",
      onDelete: "CASCADE",
    });
    StudentLanguage.belongsTo(Student, {
      foreignKey: "studentId",
      as: "student",
    });

    // StudentView
    Company.hasMany(StudentView, {
      foreignKey: "companyId",
      as: "companyViews",
      onDelete: "CASCADE",
    });
    Student.hasMany(StudentView, {
      foreignKey: "studentId",
      as: "views",
      onDelete: "CASCADE",
    });
    StudentView.belongsTo(Company, {
      foreignKey: "companyId",
      as: "company",
    });
    StudentView.belongsTo(Student, {
      foreignKey: "studentId",
      as: "student",
    });
    
    // Student -> User
    Student.belongsTo(User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });
    User.hasOne(Student, {
      foreignKey: "userId",
      as: "student",
      onDelete: "CASCADE",
    });

    await sequelize.sync({ alter: config.db.syncAlter });
    console.log("✅ All models were synchronized successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

module.exports = {
  initDatabase,
  sequelize,
  models: {
    User,
    Skill,
    Company,
    JobOpening,
    JobApplication,
    JobApplicationFeedback,
    ...studentModels,
  },
};
