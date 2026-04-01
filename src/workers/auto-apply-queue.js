const Bull = require('bull');
const cron = require('node-cron');
const config = require('../config/config');
const JobOpeningStatus = require('../constants/job-opening-status');

const QUEUE_NAME = 'auto-apply';

let queue = null;
let worker = null;
let cronTask = null;

function startAutoApplyWorker() {
  const redisUrl = config.redis?.url || 'redis://localhost:6379';
  const cronExpression = config.autoApply?.cronExpression || '*/15 * * * *';

  try {
    queue = new Bull(QUEUE_NAME, redisUrl, {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });

    queue.process(async (job) => {
      const { jobId } = job.data;
      if (!jobId) return { created: 0 };

      const jobApplicationBusiness = require('../api/job-applications/job-application-business');
      const result = await jobApplicationBusiness.processAutoApplyForJob(jobId);
      return result;
    });

    queue.on('completed', (job, result) => {
      if (result?.created > 0) {
        console.log(`[auto-apply] Vaga ${job.data.jobId}: ${result.created} candidatura(s) criada(s).`);
      }
    });

    queue.on('failed', (job, err) => {
      console.error(`[auto-apply] Vaga ${job?.data?.jobId} falhou:`, err?.message ?? err);
    });

    queue.on('error', (err) => {
      console.error('[auto-apply] Erro na fila:', err?.message ?? err);
    });

    cronTask = cron.schedule(cronExpression, async () => {
      const { models } = require('../config/database');
      const { JobOpening } = models;

      const jobs = await JobOpening.findAll({
        where: {
          status: JobOpeningStatus.OPEN,
          acceptAutoApply: true,
        },
        attributes: ['id'],
      });

      for (const row of jobs) {
        await queue.add(
          { jobId: row.id },
          { jobId: String(row.id) }
        );
      }

      if (jobs.length > 0) {
        console.log(`[auto-apply] Cron: ${jobs.length} vaga(s) enfileirada(s).`);
      }
    });

    console.log(`[auto-apply] Worker iniciado (cron: ${cronExpression}, Redis: ${redisUrl}).`);
    return { queue, cronTask };
  } catch (err) {
    console.warn('[auto-apply] Não foi possível iniciar o worker (Redis indisponível?):', err?.message ?? err);
    return null;
  }
}

async function stopAutoApplyWorker() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}

module.exports = {
  startAutoApplyWorker,
  stopAutoApplyWorker,
  getQueue: () => queue,
};
