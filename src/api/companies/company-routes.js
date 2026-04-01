const companyController = require('./company-controller');
const companySchema = require('./company-schema');
const { requireRole } = require('../../utils/require-role');
const Role = require('../../constants/role');

module.exports = [
  {
    method: 'GET',
    path: '/companies/me',
    handler: companyController.findMe,
    options: {
      description: 'Buscar empresa do usuário logado',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY])],
    },
  },
  {
    method: 'GET',
    path: '/companies',
    handler: companyController.findMany,
    options: {
      description: 'Listar empresas com filtros',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT, Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: companySchema.findManySchema,
    },
  },
  {
    method: 'GET',
    path: '/companies/{id}',
    handler: companyController.findById,
    options: {
      description: 'Buscar empresa por ID',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT, Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: companySchema.findByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/companies',
    handler: companyController.create,
    options: {
      description: 'Criar novo perfil de empresa',
      tags: ['api', 'companies'],
      auth: false,
      validate: companySchema.createSchema,
    },
  },
  {
    method: 'PUT',
    path: '/companies/{id}',
    handler: companyController.update,
    options: {
      description: 'Atualizar perfil de empresa',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: companySchema.updateSchema,
    },
  },
  {
    method: 'DELETE',
    path: '/companies/{id}',
    handler: companyController.deleteById,
    options: {
      description: 'Excluir perfil de empresa',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.COLLEGE, Role.ADMIN])],
      validate: companySchema.deleteByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/companies/{id}/banner',
    handler: companyController.addBanner,
    options: {
      description: 'Enviar banner da empresa',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: companySchema.addBannerSchema,
      payload: {
        maxBytes: 5 * 1024 * 1024,
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
      },
    },
  },
  {
    method: 'POST',
    path: '/companies/{id}/logo',
    handler: companyController.addLogo,
    options: {
      description: 'Enviar logo da empresa',
      tags: ['api', 'companies'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: companySchema.addLogoSchema,
      payload: {
        maxBytes: 3 * 1024 * 1024,
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
      },
    },
  },
];
