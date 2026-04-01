const Joi = require('joi');
const JobOpeningStatus = require('../../constants/job-opening-status');
const WorkModel = require('../../constants/work-model');
const ContractType = require('../../constants/contract-type');
const DegreeType = require('../../constants/degree-type');
const Seniority = require('../../constants/seniority');
const Benefit = require('../../constants/benefit');

const findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

const findManySchema = {
  query: Joi.object({
    companyId: Joi.string().uuid().allow(null),
    companyTradeName: Joi.string().allow(null),
    title: Joi.string().allow(null),
    description: Joi.string().allow(null),
    status: Joi.string()
      .valid(...Object.values(JobOpeningStatus))
      .allow(null),
    workModel: Joi.string()
      .valid(...Object.values(WorkModel))
      .allow(null),
    contractType: Joi.string()
      .valid(...Object.values(ContractType))
      .allow(null),
    degreeType: Joi.string()
      .valid(...Object.values(DegreeType))
      .allow(null),
    seniority: Joi.string()
      .valid(...Object.values(Seniority))
      .allow(null),
    addressCity: Joi.string().optional().allow(null),
    addressState: Joi.string().uppercase().max(2).optional().allow(null),
    salaryMin: Joi.number().precision(2).min(0).allow(null),
    salaryMax: Joi.number().precision(2).min(0).allow(null),
    minAge: Joi.number().integer().min(14).max(100).allow(null),
    maxAge: Joi.number().integer().min(14).max(100).allow(null),
    minExperience: Joi.number().integer().min(0).max(50).allow(null),
    requireCompleteGraduation: Joi.boolean().allow(null),
    availableForRelocation: Joi.boolean().allow(null),
    benefits: Joi.array().items(Joi.string().valid(...Object.values(Benefit))).allow(null).single(),
    createdAfter: Joi.date().allow(null),
    createdBefore: Joi.date().allow(null),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'title', 'salary')
      .default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    limit: Joi.number().integer().min(1).optional(),
    offset: Joi.number().integer().min(0).optional(),
  }).optional(),
};

const jobOpeningFields = {
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(10).max(5000),
  requirements: Joi.array().items(Joi.string().min(3).max(500)).min(0).max(20),
  requiredSkills: Joi.array().items(Joi.string().uuid()).allow(null),
  salary: Joi.number().precision(2).min(0).allow(null),
  addressStreet: Joi.string().allow(null),
  addressNumber: Joi.string().allow(null).regex(/^\d+$/),
  addressComplement: Joi.string().allow(null),
  addressNeighborhood: Joi.string().allow(null),
  addressCity: Joi.string().allow(null),
  addressState: Joi.string().allow(null),
  addressCountry: Joi.string().default('Brasil'),
  addressZipCode: Joi.string().allow(null).regex(/^\d{8}$/),
  acceptAutoApply: Joi.boolean().default(true),
  workModel: Joi.string()
    .valid(...Object.values(WorkModel))
    .allow(null),
  contractType: Joi.string()
    .valid(...Object.values(ContractType))
    .allow(null),
  degreeType: Joi.string()
    .valid(...Object.values(DegreeType))
    .allow(null),
  seniority: Joi.string()
    .valid(...Object.values(Seniority))
    .allow(null),
  minExperience: Joi.number().integer().min(0).max(50).allow(null),
  minAge: Joi.number().integer().min(14).max(100).allow(null),
  maxAge: Joi.number().integer().min(14).max(100).allow(null),
  requireCompleteGraduation: Joi.boolean().allow(null),
  availableForRelocation: Joi.boolean().allow(null),
  benefits: Joi.array().items(Joi.string().valid(...Object.values(Benefit))).allow(null),
  otherBenefits: Joi.array().items(Joi.string().min(3).max(100)).allow(null),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  salaryMin: Joi.number().precision(2).min(0).allow(null),
  salaryMax: Joi.number().precision(2).min(0).allow(null),
};

const createSchema = {
  payload: Joi.object({
    ...jobOpeningFields,
    companyId: Joi.string().uuid().required(),
    title: jobOpeningFields.title.required(),
    description: jobOpeningFields.description.required(),
    requirements: jobOpeningFields.requirements.required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }).required(),
};

const updateSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    ...jobOpeningFields,
    status: Joi.string().valid(...Object.values(JobOpeningStatus)).optional(),
  }).optional(),
};

const deleteByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

module.exports = {
  findByIdSchema,
  findManySchema,
  createSchema,
  updateSchema,
  deleteByIdSchema,
};
