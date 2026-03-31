import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { BadRequestError } from '../utils/errors.js'

interface ValidateOptions {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

export function validate(schemas: ValidateOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }
      next()
    } catch (error: any) {
      const message = error.errors?.[0]?.message || 'Validation failed'
      next(new BadRequestError(message))
    }
  }
}
