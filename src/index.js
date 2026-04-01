const server = require('./config/server');
const database = require('./config/database');
const { startAutoApplyWorker } = require('./workers/auto-apply-queue');

(async () => {
  try {
    await database.initDatabase();
    await server.init();
    startAutoApplyWorker();
  } catch (e) {
    console.error('Falha ao iniciar a aplicação:', e?.message ?? e);
    if (e?.stack) console.error(e.stack);
    process.exit(1);
  }
})();
