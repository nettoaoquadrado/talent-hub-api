const jobApplicationController = require('./job-application-controller');
const jobApplicationSchema = require('./job-application-schema');
const { requireRole } = require('../../utils/require-role');
const Role = require('../../constants/role');

module.exports = [
  {
    method: 'GET',
    path: '/job-applications',
    handler: jobApplicationController.findMany,
    options: {
      description: 'Listar candidaturas com filtros',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT, Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
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
      pre: [requireRole([Role.STUDENT, Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
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
      pre: [requireRole([Role.STUDENT])],
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
      pre: [requireRole([Role.STUDENT])],
      validate: jobApplicationSchema.updateCoverLetterSchema,
    },
  },
  {
    method: 'PATCH',
    path: '/job-applications/{id}/status',
    handler: jobApplicationController.updateStatus,
    options: {
      description: 'Atualizar status (empresa/college/admin) ou desistir (estudante)',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT, Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: jobApplicationSchema.updateStatusSchema,
    },
  },
  {
    method: 'POST',
    path: '/job-applications/{id}/score',
    handler: jobApplicationController.computeScore,
    options: {
      description: 'Calcular e salvar score da candidatura',
      tags: ['api', 'job-applications'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: jobApplicationSchema.findByIdSchema,
    },
  },
];
