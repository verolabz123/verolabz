import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses with timing
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
  });

  // Capture response
  const originalSend = res.send;

  res.send = function (data: any): Response {
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length'),
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

export default requestLogger;
