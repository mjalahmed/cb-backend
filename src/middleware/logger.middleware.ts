import { type Request, type Response, type NextFunction } from 'express';
import logger from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.method === 'POST' || req.method === 'PATCH' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel](`${req.method} ${req.path} ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

export const errorLogger = (err: Error, req: Request, _res: Response, next: NextFunction): void => {
  logger.error('Request Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: req.body,
  });

  next(err);
};

