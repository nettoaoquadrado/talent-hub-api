// @ts-nocheck
const Hapi = require("@hapi/hapi");
const HapiSwagger = require("hapi-swagger");
const Vision = require("@hapi/vision");
const Inert = require("@hapi/inert");
const HapiAuthJwt2 = require("hapi-auth-jwt2");
const config = require("./config");
const { registerErrorHandler } = require("../utils/error-handler");

const userRoutes = require("../api/users/user-routes");
const skillRoutes = require("../api/skills/skill-routes");
const studentRoutes = require("../api/students/student-routes");
const companyRoutes = require("../api/companies/company-routes");
const jobOpeningRoutes = require("../api/job-openings/job-opening-routes");
const jobApplicationRoutes = require("../api/job-applications/job-application-routes");
const fileRoutes = require("../api/files/file-routes");
const { BadRequestException } = require("../utils/app-exception");

module.exports.init = async () => {
  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
    routes: {
      cors: {
        origin: ['*'],
        additionalHeaders: ['authorization', 'content-type'],
        credentials: true,
      },
      validate: {
        failAction: async (request, h, err) => {
          throw new BadRequestException('Dados inválidos', err.details);
        },
      },
    },
  });

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: "Talent Hub API",
          version: "1.0.0",
        },
        securityDefinitions: {
          jwt: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
          },
        },
        documentationPath: "/docs",
      },
    },
    HapiAuthJwt2,
  ]);

  server.auth.strategy("jwt", "jwt", {
    key: config.jwt.secret,
    // eslint-disable-next-line no-unused-vars
    validate: async (decoded, request, h) => ({ isValid: true }),
  });
  server.auth.default("jwt");

  registerErrorHandler(server);

  server.route(userRoutes);
  server.route(skillRoutes);
  server.route(studentRoutes);
  server.route(companyRoutes);
  server.route(jobOpeningRoutes);
  server.route(jobApplicationRoutes);
  server.route(fileRoutes);

  await server.start();
  console.log("Servidor rodando em %s", server.info.uri);

  console.log("\n📍 Rotas registradas:");

  server
    .table()
    .sort((a, b) => {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    })
    .forEach((route) => {
      if (route.path.includes("swagger")) return;
      console.log(`  ${route.method.toUpperCase().padEnd(6)} ${route.path}`);
    });
};
