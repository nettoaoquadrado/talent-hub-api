const server = require('./config/server');
const database = require('./config/database');

(async () => {
  try {
    await database.initDatabase();
    await server.init();
  } catch (e) {
    console.error('Falha ao iniciar a aplicação:', e?.message ?? e);
    if (e?.stack) console.error(e.stack);
    process.exit(1);
  }
})();
