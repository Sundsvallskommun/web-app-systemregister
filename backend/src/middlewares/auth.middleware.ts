import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@config';
import { HttpException } from '@/exceptions/HttpException';
import { JwtPayload, User, UserRole } from '@/interfaces/user.interface';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpException(401, 'Missing or invalid Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(new HttpException(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new HttpException(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpException(403, `Requires role: ${roles.join(', ')}`));
    }
    next();
  };
}
