import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import winston, { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LOG_DIR } from '@config';

const logDir: string = join(__dirname, LOG_DIR || '../../data/logs');
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

const logFormat = format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

export const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  transports: [
    new DailyRotateFile({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: join(logDir, 'debug'),
      filename: '%DATE%.log',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: join(logDir, 'error'),
      filename: '%DATE%.log',
      maxFiles: '30d',
      zippedArchive: true,
      handleExceptions: true,
      json: false,
    }),
    new transports.Console({
      format: format.combine(format.splat(), format.colorize()),
    }),
  ],
});

export const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};
