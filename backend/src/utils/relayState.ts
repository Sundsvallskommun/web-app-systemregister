import { Request } from 'express';
import { ORIGIN, SAML_FAILURE_REDIRECT, SAML_SUCCESS_REDIRECT } from '@config';

export interface RelayState {
  successRedirect: string;
  failureRedirect: string;
}

const allowedOrigins = (ORIGIN ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const isValidUrl = (value?: string): value is string => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Open redirect-skydd: bara frontend-origins från ORIGIN får användas som
 * redirect-mål efter inloggning/utloggning.
 */
export const isAllowedRedirect = (value?: string): boolean => {
  if (!isValidUrl(value)) return false;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(new URL(value).origin);
};

/**
 * RelayState skickas till IdP:n och kommer tillbaka i callbacken. Vi packar in
 * vart användaren ska tillbaka så att en djuplänk överlever inloggningen.
 */
export const getRelayState = (req: Request): string => {
  const successRedirect =
    typeof req.query?.successRedirect === 'string' && isAllowedRedirect(req.query.successRedirect)
      ? req.query.successRedirect
      : (SAML_SUCCESS_REDIRECT ?? '/');

  const failureRedirect =
    typeof req.query?.failureRedirect === 'string' && isAllowedRedirect(req.query.failureRedirect)
      ? req.query.failureRedirect
      : (SAML_FAILURE_REDIRECT ?? successRedirect);

  const relayState: RelayState = { successRedirect, failureRedirect };

  return JSON.stringify(relayState);
};

const parseRelayState = (req: Request): Partial<RelayState> => {
  const raw =
    typeof req.body?.RelayState === 'string'
      ? req.body.RelayState
      : typeof req.query?.RelayState === 'string'
        ? req.query.RelayState
        : undefined;

  if (!raw) return {};

  try {
    return JSON.parse(raw) as RelayState;
  } catch {
    return {};
  }
};

/** Läser ut validerade redirect-mål ur RelayState, med env-defaults som fallback. */
export const getRedirects = (
  req: Request,
  fallbackUrl: string = SAML_SUCCESS_REDIRECT ?? '/',
): { successRedirect: URL; failureRedirect: URL } => {
  const relayState = parseRelayState(req);

  const successRedirect = isAllowedRedirect(relayState.successRedirect)
    ? new URL(relayState.successRedirect as string)
    : new URL(fallbackUrl);

  const failureRedirect = isAllowedRedirect(relayState.failureRedirect)
    ? new URL(relayState.failureRedirect as string)
    : isAllowedRedirect(SAML_FAILURE_REDIRECT)
      ? new URL(SAML_FAILURE_REDIRECT as string)
      : successRedirect;

  return { successRedirect, failureRedirect };
};
