const Joi = require('joi');
const SkillType = require('../../constants/skill-type');

module.exports.findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

module.exports.findManySchema = {
  query: Joi.object({
    name: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(SkillType))
      .optional(),
    limit: Joi.number().integer().min(1).optional(),
    offset: Joi.number().integer().min(0).optional(),
  }).optional(),
};

module.exports.createSchema = {
  payload: Joi.object({
    name: Joi.string().required(),
    type: Joi.string()
      .valid(...Object.values(SkillType))
      .required(),
  }).required(),
};

module.exports.updateSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    name: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(SkillType))
      .optional(),
  }).required(),
};

module.exports.deleteByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};
