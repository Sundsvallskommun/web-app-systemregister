import bodyParser from 'body-parser';
import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import type { AuthenticateOptions } from '@node-saml/passport-saml/lib/types';
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
  SAML_LOGOUT_REDIRECT,
  SAML_PUBLIC_KEY,
} from '@config';
import { User } from '@/interfaces/user.interface';
import { logger } from '@/utils/logger';
import { getRedirects, getRelayState } from '@/utils/relayState';
import { normalizeCertificate, singleLogoutEnabled } from '@/utils/samlOptions';

const loginLimiter = rateLimit({
  windowMs: Number(AUTH_RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000),
  max: Number(AUTH_RATE_LIMIT_MAX ?? 10),
  message: { message: 'För många inloggningsförsök, försök igen senare' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * SAML-flödet mot kommunens IdP.
 *
 *   GET  /saml/login            -> redirect till IdP:n
 *   POST /saml/login/callback   -> IdP:n postar assertion hit, session skapas
 *   GET  /saml/logout           -> initierar Single Logout
 *   GET  /saml/logout/callback  -> IdP:n skickar tillbaka hit, session rensas
 *   GET  /saml/metadata         -> SP-metadata att registrera hos IdP:n
 */
export function buildSamlRouter(strategy: SamlStrategy): Router {
  const router = Router();

  router.get('/login', (req: Request, res: Response, next: NextFunction) => {
    const { failureRedirect } = getRedirects(req);
    // RelayState skickas som additionalParams — Express cachar req.query, så
    // det räcker inte att skriva om req.url innan passport läser den.
    passport.authenticate('saml', {
      failureRedirect: failureRedirect.toString(),
      // additionalParams finns i passport-samls egna options men inte i @types/passport
      additionalParams: { RelayState: getRelayState(req) },
    } as AuthenticateOptions)(req, res, next);
  });

  router.get('/metadata', (req: Request, res: Response, next: NextFunction) => {
    const cert = normalizeCertificate(SAML_PUBLIC_KEY) ?? null;
    try {
      res.type('application/xml').status(200).send(strategy.generateServiceProviderMetadata(cert, cert));
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/login/callback',
    loginLimiter,
    bodyParser.urlencoded({ extended: false }),
    (req: Request, res: Response, next: NextFunction) => {
      const { successRedirect, failureRedirect } = getRedirects(req);

      const redirectWithFailure = (message: string) => {
        const params = new URLSearchParams(failureRedirect.searchParams);
        params.set('failMessage', message || 'SAML_UNKNOWN_ERROR');
        failureRedirect.search = params.toString();
        return res.redirect(failureRedirect.toString());
      };

      passport.authenticate(
        'saml',
        { failureRedirect: failureRedirect.toString(), failureMessage: true },
        (err: Error | null, user: User | false | null, info?: { message?: string; name?: string }) => {
          if (err) {
            logger.error('SAML callback misslyckades', err);
            return redirectWithFailure(err.message || 'SAML_UNKNOWN_ERROR');
          }

          if (!user) {
            return redirectWithFailure(info?.message ?? info?.name ?? 'NO_USER');
          }

          req.login(user, loginErr => {
            if (loginErr) {
              logger.error('Kunde inte skapa session', loginErr);
              return redirectWithFailure('SAML_UNKNOWN_ERROR');
            }

            req.session.save(saveErr => {
              if (saveErr) {
                logger.error('Kunde inte spara session', saveErr);
                return redirectWithFailure('SAML_UNKNOWN_ERROR');
              }
              return res.redirect(successRedirect.toString());
            });
          });
        },
      )(req, res, next);
    },
  );

  router.get('/logout', bodyParser.urlencoded({ extended: false }), (req: Request, res: Response) => {
    const { successRedirect } = getRedirects(req, SAML_LOGOUT_REDIRECT ?? '/');

    const destroySession = (redirectTo: string) => {
      req.logout(err => {
        if (err) logger.error('Fel vid utloggning', err);
        req.session.destroy(destroyErr => {
          if (destroyErr) logger.error('Kunde inte förstöra sessionen', destroyErr);
          res.clearCookie('connect.sid');
          res.redirect(redirectTo);
        });
      });
    };

    // Ingen inloggad användare, eller en IdP utan SLO — logga ut lokalt
    if (!req.isAuthenticated?.() || !singleLogoutEnabled) {
      return destroySession(successRedirect.toString());
    }

    // Samma sak här: strategy.logout läser RelayState från req.query
    (req.query as Record<string, unknown>).RelayState = getRelayState(req);

    strategy.logout(req as never, (err, url) => {
      if (err || !url) {
        if (err) logger.error('Kunde inte initiera Single Logout', err);
        return destroySession(successRedirect.toString());
      }
      // Rensa den lokala sessionen först, låt sedan IdP:n avsluta sin
      destroySession(url);
    });
  });

  // IdP:n skickar sitt LogoutResponse antingen som redirect eller som POST —
  // SP-metadatan annonserar HTTP-POST, så båda behöver hanteras.
  const logoutCallback = (req: Request, res: Response) => {
    const { successRedirect } = getRedirects(req, SAML_LOGOUT_REDIRECT ?? '/');

    req.logout(err => {
      if (err) logger.error('Fel vid utloggning', err);
      req.session.destroy(destroyErr => {
        if (destroyErr) logger.error('Kunde inte förstöra sessionen', destroyErr);
        res.clearCookie('connect.sid');
        res.redirect(successRedirect.toString());
      });
    });
  };

  router.get('/logout/callback', bodyParser.urlencoded({ extended: false }), logoutCallback);
  router.post('/logout/callback', bodyParser.urlencoded({ extended: false }), logoutCallback);

  return router;
}
