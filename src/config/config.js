const dotenv = require("dotenv");
const path = require("path");

const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, `../../.env-${env}`);

dotenv.config({ path: envPath });

module.exports = {
  app: {
    env,
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || "localhost",
    },
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        name: process.env.DB_NAME
    }, 
    auth: {
        jwtSecret: process.env.JWT_SECRET
    }
};
