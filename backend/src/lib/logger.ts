/**
 * ClearMed Logger — Phase 4
 * Winston structured logging → JSON format for CloudWatch/Loki ingestion
 */

import winston from 'winston';

const { combine, timestamp, json, errors, colorize, simple } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd
    ? combine(timestamp(), errors({ stack: true }), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
  defaultMeta: { service: 'clearmed-api', version: '4.0.0' },
  transports: [
    new winston.transports.Console(),
    ...(isProd ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 10_000_000, maxFiles: 5 }),
      new winston.transports.File({ filename: 'logs/combined.log', maxsize: 10_000_000, maxFiles: 10 }),
    ] : []),
  ],
});

// Request logger middleware
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, 'HTTP', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms,
      ip: req.ip,
      ua: req.get('User-Agent')?.slice(0, 80),
    });

    // Alert on slow queries > 2s
    if (ms > 2000) {
      logger.warn('SLOW_REQUEST', { method: req.method, path: req.path, ms });
    }
  });
  next();
}

// Audit logger — for admin actions
export function auditLog(action: string, entity: string, description: string, meta?: Record<string, unknown>) {
  logger.info('AUDIT', { action, entity, description, ...meta });
}
