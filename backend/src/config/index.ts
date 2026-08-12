import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  APP_NAME,
  NODE_ENV,
  PORT,
  BASE_URL_PREFIX,
  API_BASE_URL,
  MUNICIPALITY_ID,
  ORIGIN,
  LOG_FORMAT,
  LOG_DIR,
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX,

  // Session
  SECRET_KEY,
  SESSION_STORE,
  SESSION_TTL,

  // SAML / SSO
  SAML_ENTRY_SSO,
  SAML_IDP_PUBLIC_CERT,
  SAML_ISSUER,
  SAML_CALLBACK_URL,
  SAML_LOGOUT_URL,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_PRIVATE_KEY,
  SAML_PUBLIC_KEY,
  SAML_SUCCESS_REDIRECT,
  SAML_FAILURE_REDIRECT,
  SAML_LOGOUT_REDIRECT,

  // AD-grupper -> behörighetsnivå
  ADMIN_GROUP,
  EDITOR_GROUP,
  VIEWER_GROUP,
} = process.env;

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const SWAGGER_ENABLED = process.env.SWAGGER_ENABLED === 'true';
