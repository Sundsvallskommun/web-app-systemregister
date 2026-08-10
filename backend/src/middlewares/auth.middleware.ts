import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { UserRole } from '@/interfaces/user.interface';

/** Kräver en giltig SSO-session (sessionscookie satt vid SAML-inloggningen). */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }
  next(new HttpException(401, 'NOT_AUTHENTICATED'));
}

/** Kräver att användarens AD-grupp ger någon av rollerna. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new HttpException(401, 'NOT_AUTHENTICATED'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpException(403, `Kräver behörighet: ${roles.join(', ')}`));
    }
    next();
  };
}
