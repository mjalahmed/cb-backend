import { type Request, type Response, type NextFunction } from 'express';
import logger from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Extract user info if authenticated
  const userInfo = (req as any).user ? {
    userId: (req as any).user.userId,
    username: (req as any).user.username,
    role: (req as any).user.role
  } : undefined;

  // Build request metadata
  const requestMeta: Record<string, any> = {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    ...(userInfo && { user: userInfo }),
    ...(Object.keys(req.query).length > 0 && { query: req.query }),
    ...((req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') && 
        req.body && 
        Object.keys(req.body).length > 0 && 
        { body: sanitizeBody(req.body) })
  };

  // Log incoming request
  logger.http(`→ ${req.method} ${req.originalUrl || req.path}`, requestMeta);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? (res.statusCode >= 500 ? 'error' : 'warn') : 'http';
    
    const responseMeta: Record<string, any> = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      ...(userInfo && { user: userInfo })
    };

    // Add performance warning for slow requests
    if (duration > 1000) {
      responseMeta.slowRequest = true;
    }

    const statusEmoji = res.statusCode >= 500 ? '❌' : 
                        res.statusCode >= 400 ? '⚠️' : 
                        res.statusCode >= 300 ? '↪️' : '✓';
    
    logger[logLevel](`${statusEmoji} ${req.method} ${req.originalUrl || req.path} ${res.statusCode} (${duration}ms)`, responseMeta);
  });

  next();
};

// Helper function to sanitize sensitive data from request body
const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'otp', 'token', 'secret', 'apiKey', 'authorization'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
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

