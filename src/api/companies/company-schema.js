const Joi = require('joi');
const CompanySize = require('../../constants/company-size');
const userSchema = require('../users/user-schema');

const findByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

const findManySchema = {
  query: Joi.object({
    cnpj: Joi.string()
      .regex(/^\d{14}$/)
      .allow(null),
    tradeName: Joi.string().allow(null),
    sector: Joi.string().allow(null),
    size: Joi.string()
      .valid(...Object.values(CompanySize))
      .allow(null),
    locationCity: Joi.string().allow(null, ''),
    locationState: Joi.string().allow(null, ''),
    limit: Joi.number().integer().min(1).optional().default(10),
    offset: Joi.number().integer().min(0).optional().default(0),
  }).optional(),
};

const companyFields = {
  corporateName: Joi.string(),
  tradeName: Joi.string(),
  cnpj: Joi.string().regex(/^\d{14}$/),
  description: Joi.string().allow(null),
  sector: Joi.string().allow(null),
  size: Joi.string().valid(...Object.values(CompanySize)),
  foundedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()),
  websiteUrl: Joi.string().uri().allow(null),
  linkedinUrl: Joi.string().uri().allow(null),
  logoUrl: Joi.string().uri().allow(null),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string()
    .pattern(/^\d{10,11}$/)
    .allow(null),
  locationZipcode: Joi.string().pattern(/^\d{8}$/),
  locationCity: Joi.string().required(),
  locationState: Joi.string().required(),
  locationAddress: Joi.string().required(),
  locationNumber: Joi.number().required(),
  locationNeighborhood: Joi.string().required(),
  locationComplement: Joi.string().allow(null),
};

const createSchema = {
  payload: Joi.object({
    ...companyFields,
    user: userSchema.createPayloadSchema.required(),
    corporateName: companyFields.corporateName.required(),
    tradeName: companyFields.tradeName.required(),
    cnpj: companyFields.cnpj.required(),
    size: companyFields.size.required(),
    contactEmail: companyFields.contactEmail.required(),
  }).required(),
};

const updateSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    ...companyFields,
  }).required(),
};

const deleteByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
};

const addBannerSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    banner: Joi.any()
      .meta({ swaggerType: 'file' })
      .required()
      .description('Banner da empresa (form-data, key: banner)'),
  }).required(),
};

const addLogoSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  payload: Joi.object({
    logo: Joi.any()
      .meta({ swaggerType: 'file' })
      .required()
      .description('Logo da empresa (form-data, key: logo)'),
  }).required(),
};

module.exports = {
  findByIdSchema,
  findManySchema,
  createSchema,
  updateSchema,
  deleteByIdSchema,
  addBannerSchema,
  addLogoSchema,
};
