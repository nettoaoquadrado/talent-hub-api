const Joi = require('joi');
const Role = require('../../constants/role');

module.exports.findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports.findManySchema = {
  query: Joi.object({
    role: Joi.string().valid(...Role.ROLES),
    isActive: Joi.boolean().default(true),
    email: Joi.string().email(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

module.exports.createPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

module.exports.changePasswordSchema = {
  payload: Joi.object({
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
  }),
};

module.exports.authSchema = {
  payload: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(6).required(),
  }),
};
