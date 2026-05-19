import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  APP_NAME,
  NODE_ENV,
  PORT,
  BASE_URL_PREFIX,
  API_BASE_URL,
  MUNICIPALITY_ID,
  JWT_SECRET,
  JWT_ACCESS_TTL,
  JWT_REFRESH_TTL,
  ORIGIN,
  LOG_FORMAT,
  LOG_DIR,
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX,
} = process.env;

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const SWAGGER_ENABLED = process.env.SWAGGER_ENABLED === 'true';
