const Joi = require('joi');
const JobApplicationStatus = require('../../constants/job-application-status');

const findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

const findManySchema = {
  query: Joi.object({
    jobId: Joi.string().uuid().allow(null),
    status: Joi.string()
      .valid(...Object.values(JobApplicationStatus))
      .allow(null),
    companyId: Joi.string().uuid().allow(null, ''),
    companyTradeName: Joi.string().allow(null, ''),
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').optional(),
  }).optional(),
};

const createSchema = {
  payload: Joi.object({
    jobId: Joi.string().uuid().required(),
    studentId: Joi.string().uuid().required(),
    coverLetter: Joi.string().min(10).max(2000).allow(null),
  }).required(),
};

const updateCoverLetterSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    coverLetter: Joi.string().min(10).max(2000).required(),
  }).required(),
};

const updateStatusSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
    payload: Joi.object({
    status: Joi.string().valid(...Object.values(JobApplicationStatus)).required(),
    feedback: Joi.string().min(10).max(1000).allow(null).empty(null),
  }).required(),
};

module.exports = {
  findByIdSchema,
  findManySchema,
  createSchema,
  updateCoverLetterSchema,
  updateStatusSchema,
};
