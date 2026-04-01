const jobOpeningController = require('./job-opening-controller');
const jobOpeningSchema = require('./job-opening-schema');
const { requireRole } = require('../../utils/require-role');
const Role = require('../../constants/role');

module.exports = [
  {
    method: 'GET',
    path: '/job-openings',
    handler: jobOpeningController.findMany,
    options: {
      description: 'Listar vagas de emprego com filtros',
      tags: ['api', 'job-openings'],
      auth: false,
      validate: jobOpeningSchema.findManySchema,
    },
  },
  {
    method: 'GET',
    path: '/job-openings/{id}',
    handler: jobOpeningController.findById,
    options: {
      description: 'Buscar vaga de emprego por ID',
      tags: ['api', 'job-openings'],
      auth: false,
      validate: jobOpeningSchema.findByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/job-openings',
    handler: jobOpeningController.create,
    options: {
      description: 'Criar nova vaga de emprego',
      tags: ['api', 'job-openings'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: jobOpeningSchema.createSchema,
    },
  },
  {
    method: 'PUT',
    path: '/job-openings/{id}',
    handler: jobOpeningController.update,
    options: {
      description: 'Atualizar vaga de emprego',
      tags: ['api', 'job-openings'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: jobOpeningSchema.updateSchema,
    },
  },
  {
    method: 'DELETE',
    path: '/job-openings/{id}',
    handler: jobOpeningController.deleteById,
    options: {
      description: 'Excluir vaga de emprego',
      tags: ['api', 'job-openings'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: jobOpeningSchema.deleteByIdSchema,
    },
  },
];
