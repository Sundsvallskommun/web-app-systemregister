import { Request } from 'express';
import { Strategy as SamlStrategy, VerifiedCallback } from '@node-saml/passport-saml';
import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/interfaces/profile.interface';
import { User } from '@/interfaces/user.interface';
import { getPrimaryRole } from '@/services/authorization.service';
import { logger } from '@/utils/logger';
import { normalizeGroup } from '@/utils/normalizeGroup';
import { samlConfig } from '@/utils/samlOptions';

/**
 * Grupperna kommer antingen som ADFS-claim (en lista) eller som ett enkelt
 * `groups`-attribut med kommaseparerade värden (Onegate / fake-sso-idp).
 */
export const getProfileGroups = (profile: Profile): string[] => {
  const rawGroups = profile['http://schemas.xmlsoap.org/claims/Group'] ?? profile.groups;

  if (!rawGroups) return [];

  const groups = Array.isArray(rawGroups) ? rawGroups : String(rawGroups).split(',');

  return groups.map(normalizeGroup).filter(Boolean);
};

/** Plockar ut användaruppgifterna ur SAML-profilen, oavsett federationslösning. */
export function profileToUser(profile: Profile): User {
  const givenName =
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ?? profile.givenName;
  const surname =
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ??
    profile.sn ??
    profile.surname;
  const email =
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
    profile.email ??
    profile.nameID;
  const username =
    profile['urn:oid:0.9.2342.19200300.100.1.1'] ?? profile.username ?? profile.nameID;

  if (!givenName || !surname || !username) {
    throw new HttpException(401, 'SAML_MISSING_ATTRIBUTES');
  }

  const groups = getProfileGroups(profile);
  const role = getPrimaryRole(groups);

  if (!role) {
    logger.warn(`Inloggning nekad för ${username} — ingen behörighetsgrupp bland [${groups.join(', ')}]`);
    throw new HttpException(403, 'MISSING_PERMISSIONS');
  }

  return {
    username: String(username),
    name: `${givenName} ${surname}`,
    givenName: String(givenName),
    surname: String(surname),
    email: String(email ?? ''),
    groups,
    role,
  };
}

export function createSamlStrategy(): SamlStrategy {
  return new SamlStrategy(
    samlConfig,
    (_req: Request, profile: Profile | null, done: VerifiedCallback) => {
      if (!profile) {
        return done(new Error('SAML_MISSING_PROFILE'));
      }

      try {
        const user = profileToUser(profile);
        logger.info(`Inloggad: ${user.username} (${user.role})`);
        return done(null, user as unknown as Record<string, unknown>);
      } catch (err) {
        const message = err instanceof HttpException ? err.message : 'AUTH_FAILED';
        return done(null, undefined, { name: message, message });
      }
      // Strategy-typerna matchar inte MultiSaml/Saml-varianterna rakt av
    },
    (_req: Request, _profile: Profile | null, done: VerifiedCallback) => done(null, {}),
  );
}
