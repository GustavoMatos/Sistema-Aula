import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { config } from '../config/index.js'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  logger.error(`${err.name}: ${err.message}`)
  
  if (config.env === 'development') {
    logger.debug(err.stack || '')
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.name === 'ValidationError' && { errors: (err as any).errors }),
    })
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      errors: (err as any).errors,
    })
  }

  // Handle unknown errors
  return res.status(500).json({
    error: config.env === 'production' 
      ? 'Internal server error' 
      : err.message,
  })
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
  })
}
