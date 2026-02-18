const studentController = require('./student-controller');
const studentSchema = require('./student-schema');

module.exports = [
  {
    method: 'GET',
    path: '/students',
    handler: studentController.findMany,
    options: {
      description: 'Listar estudantes com filtros',
      tags: ['api', 'students'],
      auth: 'jwt',
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
      validate: studentSchema.addViewSchema,
    },
  },
  {
    method: 'POST',
    path: '/students/{id}/resume',
    handler: studentController.addResume,
    options: {
      description: 'Enviar currículo em PDF (form-data, key: resume)',
      tags: ['api', 'students'],
      auth: 'jwt',
      validate: studentSchema.addResumeSchema,
      payload: {
        maxBytes: 5 * 1024 * 1024, // 5MB
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
      description: 'Enviar foto de perfil (form-data, key: profilePicture). Mimetype enviado é usado no upload.',
      tags: ['api', 'students'],
      auth: 'jwt',
      validate: studentSchema.addProfilePictureSchema,
      payload: {
        maxBytes: 3 * 1024 * 1024, // 3MB
        parse: true,
        allow: 'multipart/form-data',
        multipart: true, 
        output: 'data',
      },
    },
  },
  {
    method: 'GET',
    path: '/students/me/profile-completation-percentage',
    handler: studentController.getProfileCompletationPercentage,
    options: {
      description: 'Buscar percentual de completude do perfil de estudante',
      tags: ['api', 'students'],
      auth: 'jwt',
    },
  }
];
