import { Profile as SamlProfile } from '@node-saml/passport-saml';

/**
 * Attributnamnen skiljer sig beroende på federationslösning (ADFS skickar
 * claim-URI:er, Onegate/fake-sso-idp skickar korta namn). Därför finns båda
 * varianterna här och koden läser dem med ?? mellan sig.
 */
export interface Profile extends SamlProfile {
  givenName?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'?: string;
  sn?: string;
  surname?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'?: string;
  email?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  username?: string;
  'urn:oid:0.9.2342.19200300.100.1.1'?: string;
  groups?: string | string[];
  'http://schemas.xmlsoap.org/claims/Group'?: string | string[];
  /** Organisationsträdet, `nivå|orgId|namn` per nivå separerade med ¤ */
  orgTree?: string;
  orgtree?: string;
  attributes?: { [key: string]: unknown };
}
