import { cleanEnv, port, str, num } from 'envalid';

export default function validateEnv(): void {
  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: port({ default: 3001 }),
    BASE_URL_PREFIX: str({ default: '/api' }),
    API_BASE_URL: str(),
    MUNICIPALITY_ID: str({ default: '2281' }),
    JWT_SECRET: str(),
    JWT_ACCESS_TTL: num({ default: 3600 }),
    JWT_REFRESH_TTL: num({ default: 604800 }),
    ORIGIN: str({ default: 'http://localhost:3000' }),
    LOG_FORMAT: str({ default: 'dev' }),
  });
}
