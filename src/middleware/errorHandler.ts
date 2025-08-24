import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error class
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new CustomError(message, 404);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(', ');
    error = new CustomError(message, 400);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    switch (prismaError.code) {
      case 'P2002':
        error = new CustomError('Unique constraint violation', 400);
        break;
      case 'P2025':
        error = new CustomError('Record not found', 404);
        break;
      case 'P2003':
        error = new CustomError('Foreign key constraint violation', 400);
        break;
      default:
        error = new CustomError('Database operation failed', 500);
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new CustomError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new CustomError('Token expired', 401);
  }

  // Rate limit errors
  if (err.message && err.message.includes('Too many requests')) {
    error = new CustomError('Too many requests', 429);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  });
};

// Not found middleware
export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  const error = new CustomError(`Not found - ${_req.originalUrl}`, 404);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
