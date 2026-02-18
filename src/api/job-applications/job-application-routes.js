const jobApplicationController = require('./job-application-controller');
const jobApplicationSchema = require('./job-application-schema');

module.exports = [
  {
    method: 'GET',
    path: '/job-applications',
    handler: jobApplicationController.findMany,
    options: {
      description: 'Listar candidaturas com filtros',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      validate: jobApplicationSchema.findManySchema,
    },
  },
  {
    method: 'GET',
    path: '/job-applications/{id}',
    handler: jobApplicationController.findById,
    options: {
      description: 'Buscar candidatura por ID',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      validate: jobApplicationSchema.findByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/job-applications',
    handler: jobApplicationController.create,
    options: {
      description: 'Criar nova candidatura',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      validate: jobApplicationSchema.createSchema,
    },
  },
  {
    method: 'PATCH',
    path: '/job-applications/{id}/cover-letter',
    handler: jobApplicationController.updateCoverLetter,
    options: {
      description: 'Atualizar carta de apresentação',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      validate: jobApplicationSchema.updateCoverLetterSchema,
    },
  },
  {
    method: 'PATCH',
    path: '/job-applications/{id}/status',
    handler: jobApplicationController.updateStatus,
    options: {
      description: 'Atualizar status',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      validate: jobApplicationSchema.updateStatusSchema,
    },
  },
];
