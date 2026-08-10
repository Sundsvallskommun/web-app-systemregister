import {
  SAML_CALLBACK_URL,
  SAML_ENTRY_SSO,
  SAML_IDP_PUBLIC_CERT,
  SAML_ISSUER,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_LOGOUT_URL,
  SAML_PRIVATE_KEY,
} from '@config';

const CERTIFICATE_PREFIX = '-----BEGIN CERTIFICATE-----\n';
const CERTIFICATE_SUFFIX = '\n-----END CERTIFICATE-----\n';

/**
 * Certifikat i env-filer ligger som en rad med "\n"-escapes och ibland utan
 * PEM-header. Normalisera till ett riktigt PEM-block.
 */
export const normalizeCertificate = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const trimmed = value
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');
  const withPrefix = trimmed.startsWith('-----BEGIN CERTIFICATE-----')
    ? trimmed
    : `${CERTIFICATE_PREFIX}${trimmed}`;
  return withPrefix.trimEnd().endsWith('-----END CERTIFICATE-----')
    ? withPrefix
    : `${withPrefix}${CERTIFICATE_SUFFIX}`;
};

const normalizeKey = (value?: string | null): string | undefined =>
  value ? value.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n') : undefined;

/**
 * SAML-inställningar för applikationen. Samma konfiguration i alla miljöer —
 * det som skiljer dev från prod är vilken IdP SAML_ENTRY_SSO pekar på
 * (fake-sso-idp lokalt, kommunens ADFS i drift).
 */
/**
 * Single Logout används bara om IdP:n har en SLO-endpoint. Utan
 * SAML_LOGOUT_URL faller node-saml tillbaka på entryPoint, vilket skickar
 * LogoutRequest till inloggnings-URL:en — då loggar vi hellre ut lokalt.
 * (fake-sso-idp saknar SLO; rensa dess session på http://localhost:7000/logout.)
 */
export const singleLogoutEnabled = Boolean(SAML_LOGOUT_URL);

export const samlConfig = {
  passReqToCallback: true as const,
  disableRequestedAuthnContext: true,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
  entryPoint: SAML_ENTRY_SSO,
  idpCert: normalizeCertificate(SAML_IDP_PUBLIC_CERT) ?? '',
  issuer: SAML_ISSUER ?? 'passport-saml',
  callbackUrl: SAML_CALLBACK_URL as string,
  logoutUrl: SAML_LOGOUT_URL,
  logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL as string,
  privateKey: normalizeKey(SAML_PRIVATE_KEY),
  wantAssertionsSigned: false,
  wantAuthnResponseSigned: false,
  audience: false as const,
  acceptedClockSkewMs: -1,
};
