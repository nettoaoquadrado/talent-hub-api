const Joi = require('joi');
const JobApplicationStatus = require('../../constants/job-application-status');

const VALID_STATUSES = Object.values(JobApplicationStatus);
const SORT_BY_VALUES = ['createdAt', 'updatedAt', 'finalScore'];
const SORT_ORDER_VALUES = ['ASC', 'DESC'];

const findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

const findManySchema = {
  query: Joi.object({
    jobId: Joi.string().uuid().allow(null),
    status: Joi.string().valid(...VALID_STATUSES).allow(null),
    companyId: Joi.string().uuid().allow(null, ''),
    companyTradeName: Joi.string().allow(null, ''),
    limit: Joi.number().integer().min(1).optional(),
    offset: Joi.number().integer().min(0).optional(),
    sortBy: Joi.string().valid(...SORT_BY_VALUES).optional(),
    sortOrder: Joi.string().valid(...SORT_ORDER_VALUES).optional(),
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
    status: Joi.string().valid(...VALID_STATUSES).required(),
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
