import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@/utils/logger';

export default function errorMiddleware(
  error: HttpException | Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status = error instanceof HttpException ? error.status : 500;
  const message = error.message || 'Internal server error';
  const details = error instanceof HttpException ? error.details : undefined;

  logger.error(`[${status}] ${message}`);
  res.status(status).json({ status, message, details });
}
