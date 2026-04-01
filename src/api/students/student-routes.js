const studentController = require('./student-controller');
const studentSchema = require('./student-schema');
const { requireRole } = require('../../utils/require-role');
const Role = require('../../constants/role');

module.exports = [
  {
    method: 'GET',
    path: '/students',
    handler: studentController.findMany,
    options: {
      description: 'Listar estudantes com filtros',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: studentSchema.findManySchema,
    },
  },
  {
    method: 'GET',
    path: '/students/me',
    handler: studentController.findMe,
    options: {
      description: 'Buscar estudante atual',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT])],
    },
  },
  {
    method: 'GET',
    path: '/students/{id}',
    handler: studentController.findById,
    options: {
      description: 'Buscar estudante por ID',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT, Role.COMPANY, Role.COLLEGE, Role.ADMIN])],
      validate: studentSchema.findByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/students',
    handler: studentController.create,
    options: {
      description: 'Criar novo perfil de estudante',
      tags: ['api', 'students'],
      auth: false,
      validate: studentSchema.createSchema,
    },
  },
  {
    method: 'PUT',
    path: '/students/{id}',
    handler: studentController.update,
    options: {
      description: 'Atualizar perfil de estudante',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT])],
      validate: studentSchema.updateSchema,
    },
  },
  {
    method: 'DELETE',
    path: '/students/{id}',
    handler: studentController.deleteById,
    options: {
      description: 'Excluir perfil de estudante',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT, Role.COLLEGE, Role.ADMIN])],
      validate: studentSchema.deleteByIdSchema,
    },
  },
  {
    method: 'POST',
    path: '/students/{studentId}/views/{companyId}',
    handler: studentController.addView,
    options: {
      description: 'Adicionar visualização de estudante',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.COMPANY])],
      validate: studentSchema.addViewSchema,
    },
  },
  {
    method: 'POST',
    path: '/students/{id}/resume',
    handler: studentController.addResume,
    options: {
      description: 'Enviar currículo em PDF',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT])],
      validate: studentSchema.addResumeSchema,
      payload: {
        maxBytes: 5 * 1024 * 1024,
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        output: 'data',
      },
    },
  },
  {
    method: 'POST',
    path: '/students/{id}/profile-picture',
    handler: studentController.addProfilePicture,
    options: {
      description: 'Enviar foto de perfil',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT])],
      validate: studentSchema.addProfilePictureSchema,
      payload: {
        maxBytes: 3 * 1024 * 1024,
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
      },
    },
  },
  {
    method: 'GET',
    path: '/students/me/profile-completation-percentage',
    handler: studentController.getProfileCompletationPercentage,
    options: {
      description: 'Percentual de completude do perfil',
      tags: ['api', 'students'],
      auth: 'jwt',
      pre: [requireRole([Role.STUDENT])],
    },
  },
];
