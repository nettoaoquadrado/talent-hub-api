const userController = require('./user-controller');
const userSchema = require('./user-schema');

module.exports = [
  {
    method: 'GET',
    path: '/users',
    handler: userController.findMany,
    options: {
      description: 'Listar usuários com filtros',
      tags: ['api', 'users'],
      auth: 'jwt',
      validate: userSchema.findManySchema,
    },
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: userController.findById,
    options: {
      description: 'Buscar usuário por ID',
      tags: ['api', 'users'],
      auth: 'jwt',
      validate: userSchema.findByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/users/auth',
    handler: userController.auth,
    options: {
      description: 'Autenticar usuário (Login)',
      tags: ['api', 'users'],
      auth: false,
      validate: userSchema.authSchema,
    },
  },
  {
    method: 'PATCH',
    path: '/users/change-password',
    handler: userController.changePassword,
    options: {
      description: 'Alterar senha do usuário',
      tags: ['api', 'users'],
      auth: 'jwt',
      validate: userSchema.changePasswordSchema,
    },
  },
];
