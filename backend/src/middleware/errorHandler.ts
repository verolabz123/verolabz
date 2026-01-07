import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    isOperational = true;
  }
  // Handle MongoDB/Firestore errors
  else if (err.name === 'FirebaseError' || err.message.includes('Firebase')) {
    statusCode = 500;
    message = 'Database operation failed';
    isOperational = true;
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
    isOperational = true;
  }
  // Handle Groq API errors
  else if (err.message.includes('Groq') || err.message.includes('API')) {
    statusCode = 503;
    message = 'AI service temporarily unavailable';
    isOperational = true;
  }
  // Default error handling
  else {
    message = err.message || message;
  }

  // Log the error
  if (isOperational) {
    logger.warn('Operational error:', {
      statusCode,
      message,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error('Unexpected error:', {
      statusCode,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route ${req.method} ${req.path} not found`;
  logger.warn('404 Not Found:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: message,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Common HTTP error creators
 */
export const BadRequestError = (message: string) => new ApiError(400, message);
export const UnauthorizedError = (message: string) => new ApiError(401, message);
export const ForbiddenError = (message: string) => new ApiError(403, message);
export const NotFoundError = (message: string) => new ApiError(404, message);
export const ConflictError = (message: string) => new ApiError(409, message);
export const ValidationError = (message: string) => new ApiError(422, message);
export const TooManyRequestsError = (message: string) => new ApiError(429, message);
export const InternalError = (message: string) => new ApiError(500, message);
export const ServiceUnavailableError = (message: string) => new ApiError(503, message);

export default errorHandler;
