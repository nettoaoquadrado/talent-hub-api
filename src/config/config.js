const dotenv = require('dotenv');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../../.env-${env}`);
dotenv.config({ path: envPath });

module.exports = {
  app: {
    env,
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
  },
  db: {
    port: Number(process.env.DB_PORT) || 5432,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
    syncAlter: process.env.DB_SYNC_ALTER === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
  },
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    endpoint: process.env.AWS_S3_ENDPOINT,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  autoApply: {
    cronExpression: process.env.AUTO_APPLY_CRON || '*/15 * * * *',
    maxCandidatesToScorePerJob: Number(process.env.AUTO_APPLY_MAX_CANDIDATES) || 200,
    maxAutoApplicationsPerJob: Number(process.env.MAX_AUTO_APPLICATIONS_PER_JOB) || 15,
    minScoreThreshold: Number(process.env.AUTO_APPLY_MIN_SCORE) || 50,
  },
};
