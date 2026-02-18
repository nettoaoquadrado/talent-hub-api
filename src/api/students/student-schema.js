const Joi = require('joi');
const WorkModel = require('../../constants/work-model');
const ContractType = require('../../constants/contract-type');
const DegreeType = require('../../constants/degree-type');
const EducationStatus = require('../../constants/education-status');
const SkillLevel = require('../../constants/skill-level');
const Gender = require('../../constants/gender');
const Race = require('../../constants/race');
const GenderExpression = require('../../constants/gender-expression');
const EducationLevel = require('../../constants/education-level');
const Language = require('../../constants/language');
const LanguageProficiency = require('../../constants/language-proficiency');
const { createPayloadSchema } = require('../users/user-schema');

const profileFields = {
  fullName: Joi.string().allow(null),
  headline: Joi.string().allow(null),
  bio: Joi.string().allow(null),
  birthDate: Joi.date().allow(null),
  enrollmentNumber: Joi.string().allow(null),
  isAutoApplyEnabled: Joi.boolean().allow(null).default(true),
  phoneNumber: Joi.string()
    .pattern(/^\d{11}$/)
    .allow(null),
  linkedinUrl: Joi.string().uri().allow(null),
  githubUrl: Joi.string().uri().allow(null),
  portfolioUrl: Joi.string().uri().allow(null),
  targetRoles: Joi.array().items(Joi.string()),
  salaryExpectationMin: Joi.number().precision(2).allow(null),
  workModels: Joi.array().items(Joi.string().valid(...Object.values(WorkModel))),
  contractTypes: Joi.array().items(Joi.string().valid(...Object.values(ContractType))),
  availableForRelocation: Joi.boolean().allow(null),
  availabilityToStart: Joi.boolean().allow(null),
  gender: Joi.string().valid(...Object.values(Gender)).allow(null),
  race: Joi.string().valid(...Object.values(Race)).allow(null),
  genderExpression: Joi.string().valid(...Object.values(GenderExpression)).allow(null),
  mainEducationLevel: Joi.string().valid(...Object.values(EducationLevel)).allow(null),
  isCurrentlyWorking: Joi.boolean().allow(null),
  about: Joi.string().allow(null, ''),
  addressZipCode: Joi.string().allow(null, ''),
  addressStreet: Joi.string().allow(null, ''),
  addressNeighborhood: Joi.string().allow(null, ''),
  addressNumber: Joi.string().allow(null, ''),
  addressComplement: Joi.string().allow(null, ''),
  addressState: Joi.string().allow(null, ''),
  addressCity: Joi.string().allow(null, ''),
  addressCountry: Joi.string().allow(null, ''),
};

const educationSchema = Joi.object({
  institution: Joi.string().required(),
  degree: Joi.string()
    .valid(...Object.values(DegreeType))
    .required(),
  fieldOfStudy: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  expectedGraduationDate: Joi.date().allow(null),
  currentSemester: Joi.number().integer().allow(null),
  status: Joi.string()
    .valid(...Object.values(EducationStatus))
    .required(),
});

const experienceSchema = Joi.object({
  company: Joi.string().required(),
  position: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  description: Joi.string().allow(null),
  isCurrentlyWorking: Joi.boolean().required(),
});

const skillSchema = Joi.object({
  skillId: Joi.string().uuid().required(),
  level: Joi.string()
    .valid(...Object.values(SkillLevel))
    .required(),
});

const certificationSchema = Joi.object({
  name: Joi.string().required(),
  issuingOrganization: Joi.string().required(),
  issueDate: Joi.date().required(),
  hasExpiration: Joi.boolean().required(),
  expirationDate: Joi.date().allow(null),
  credentialId: Joi.string().allow(null),
  credentialUrl: Joi.string().uri().allow(null),
});

const languageSchema = Joi.object({
  language: Joi.string().valid(...Object.values(Language)).required(),
  proficiency: Joi.string().valid(...Object.values(LanguageProficiency)).required(),
});

module.exports.findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

module.exports.findManySchema = {
  query: Joi.object({
    fullName: Joi.string().optional().allow(null),
    addressCity: Joi.string().optional().allow(null),
    addressState: Joi.string().uppercase().max(2).optional().allow(null),
    maxSalaryBudget: Joi.number().precision(2).optional().allow(null),
    workModels: Joi.array()
      .items(Joi.string().valid(...Object.values(WorkModel)))
      .single()
      .optional(),
    contractTypes: Joi.array()
      .items(Joi.string().valid(...Object.values(ContractType)))
      .single()
      .optional(),
    availableForRelocation: Joi.boolean().optional(),
    availabilityToStart: Joi.boolean().optional(),
    skillIds: Joi.array().items(Joi.string().uuid()).single().optional(),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    offset: Joi.number().integer().min(0).optional().default(0),
  }).optional(),
};

module.exports.createSchema = {
  payload: Joi.object({
    ...profileFields,
    user: createPayloadSchema.required(),
    fullName: profileFields.fullName.required(),
    birthDate: profileFields.birthDate.required(),
    enrollmentNumber: profileFields.enrollmentNumber.required(),
    educations: Joi.array().items(educationSchema).optional().default([]),
    experiences: Joi.array().items(experienceSchema).optional().default([]),
    skills: Joi.array().items(skillSchema).optional().default([]),
    certifications: Joi.array().items(certificationSchema).optional().default([]),
    languages: Joi.array().items(languageSchema).optional().default([]),
  }).required(),
};

module.exports.updateSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    ...profileFields,
    educations: Joi.array().items(educationSchema).optional().default([]),
    experiences: Joi.array().items(experienceSchema).optional().default([]),
    skills: Joi.array().items(skillSchema).optional().default([]).unique((a, b) => a.skillId === b.skillId).messages({
      'array.unique': 'Habilidades duplicadas',
    }),
    certifications: Joi.array().items(certificationSchema).optional().default([]),
    languages: Joi.array().items(languageSchema).optional().default([]).unique((a, b) => a.language === b.language).messages({
      'array.unique': 'Línguas duplicadas',
    })
  }).required(),
};

module.exports.deleteByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

module.exports.addViewSchema = {
  params: Joi.object({
    studentId: Joi.string().uuid().required(),
    companyId: Joi.string().uuid().required(),
  }).required(),
};

module.exports.addResumeSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    resume: Joi.any()
      .meta({ swaggerType: 'file' })
      .required()
      .description('Arquivo PDF do currículo (form-data, key: resume)'),
  }).required(),
};

module.exports.addProfilePictureSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    profilePicture: Joi.any()
      .meta({ swaggerType: 'file' })
      .required()
      .description('Foto de perfil (form-data, key: profilePicture). Mimetype enviado é salvo no upload.'),
  }).required(),
};