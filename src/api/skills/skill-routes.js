const skillController = require('./skill-controller');
const skillSchema = require('./skill-schema');
const { requireRole } = require('../../utils/require-role');
const Role = require('../../constants/role');

module.exports = [
  {
    method: 'GET',
    path: '/skills',
    handler: skillController.findMany,
    options: {
      description: 'Listar skills com filtros',
      tags: ['api', 'skills'],
      auth: false,
      validate: skillSchema.findManySchema,
    },
  },
  {
    method: 'GET',
    path: '/skills/{id}',
    handler: skillController.findById,
    options: {
      description: 'Buscar skill por ID',
      tags: ['api', 'skills'],
      auth: false,
      validate: skillSchema.findByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/skills',
    handler: skillController.create,
    options: {
      description: 'Criar nova skill',
      tags: ['api', 'skills'],
      auth: 'jwt',
      pre: [requireRole([Role.COLLEGE, Role.ADMIN])],
      validate: skillSchema.createSchema,
    },
  },
  {
    method: 'PATCH',
    path: '/skills/{id}',
    handler: skillController.update,
    options: {
      description: 'Atualizar skill existente',
      tags: ['api', 'skills'],
      auth: 'jwt',
      pre: [requireRole([Role.COLLEGE, Role.ADMIN])],
      validate: skillSchema.updateSchema,
    },
  },
  {
    method: 'DELETE',
    path: '/skills/{id}',
    handler: skillController.deleteById,
    options: {
      description: 'Excluir skill existente',
      tags: ['api', 'skills'],
      auth: 'jwt',
      pre: [requireRole([Role.COLLEGE, Role.ADMIN])],
      validate: skillSchema.deleteByIdSchema,
    },
  },
];
