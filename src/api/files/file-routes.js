const Joi = require('joi');
const storageUtil = require('../../utils/storage-util');

module.exports = [
  {
    method: 'GET',
    path: '/files/{path*}',
    handler: async (req, h) => {
      const key = req.params.path;
      const { buffer, contentType } = await storageUtil.getFile(key);
      return h
        .response(buffer)
        .header('Content-Type', contentType)
        .header('Cache-Control', 'public, max-age=86400'); // 1 dia
    },
    options: {
      description: 'Servir arquivo estático do storage (S3) pela key',
      tags: ['api', 'files'],
      auth: false,
      validate: {
        params: Joi.object({
          path: Joi.string().required(),
        }).required(),
      },
    },
  },
];
