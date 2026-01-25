// @ts-nocheck
const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const HapiAuthJwt2 = require("hapi-auth-jwt2");
const config = require("../config/config");

module.exports.init = async () => {
  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
  });

  const swaggerOptions = {
    info: {
      title: "Talent Hub API",
      version: "1.0.0",
    },
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
    HapiAuthJwt2,
  ]);

  server.auth.strategy("jwt", "jwt", {
    key: config.auth.jwtSecret,
    validate: async (decoded, request, h) => {
      return { isValid: true };
    },
  });

  await server.start();

  console.log("Servidor rodando em %s", server.info.uri);
};
