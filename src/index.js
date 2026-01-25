const server = require("./config/server");
const database = require("./config/database");

(async () => {
  try {

    console.log("Sincronizando banco de dados...");
    await database.sync();
    console.log("Banco de dados sincronizado com sucesso.");

    console.log("Iniciando o servidor...");
    await server.init();
  } catch (e) {
    console.log(e);
  }
})();
