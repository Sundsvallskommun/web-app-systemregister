import { cleanEnv, port, str, num } from 'envalid';

export default function validateEnv(): void {
  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: port({ default: 3001 }),
    BASE_URL_PREFIX: str({ default: '/api' }),
    API_BASE_URL: str(),
    MUNICIPALITY_ID: str({ default: '2281' }),
    ORIGIN: str({ default: 'http://localhost:3000' }),
    LOG_FORMAT: str({ default: 'dev' }),

    // Session
    SECRET_KEY: str(),
    SESSION_TTL: num({ default: 28800 }),

    // SAML — pekar mot fake-sso-idp lokalt, kommunens IdP i drift
    SAML_ENTRY_SSO: str(),
    SAML_IDP_PUBLIC_CERT: str(),
    SAML_ISSUER: str({ default: 'passport-saml' }),
    SAML_CALLBACK_URL: str(),
    SAML_LOGOUT_CALLBACK_URL: str(),
    SAML_SUCCESS_REDIRECT: str(),
    SAML_FAILURE_REDIRECT: str(),
    SAML_LOGOUT_REDIRECT: str(),

    // AD-grupper per behörighetsnivå
    ADMIN_GROUP: str({ default: 'systemregister_admin' }),
    EDITOR_GROUP: str({ default: 'systemregister_editor' }),
    VIEWER_GROUP: str({ default: 'systemregister_viewer' }),
  });
}
