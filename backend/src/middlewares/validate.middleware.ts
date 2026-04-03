import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodObject, ZodRawShape } from 'zod'
import { BadRequestError } from '../utils/errors.js'

interface ValidateOptions {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

/**
 * Validate request using Zod schemas
 * Accepts either:
 * - A schema with shape { body?, query?, params? } for full request validation
 * - An options object with separate schemas for each part
 */
export function validate(schemaOrOptions: ZodSchema | ValidateOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Check if it's a Zod schema (has parseAsync method)
      if ('parseAsync' in schemaOrOptions && typeof schemaOrOptions.parseAsync === 'function') {
        // Check if it has a shape property (ZodObject with body/query/params)
        const zodSchema = schemaOrOptions as ZodObject<ZodRawShape>
        if (zodSchema.shape && ('body' in zodSchema.shape || 'query' in zodSchema.shape || 'params' in zodSchema.shape)) {
          // It's a combined schema - validate against request parts
          const dataToValidate: Record<string, unknown> = {}
          if ('body' in zodSchema.shape) dataToValidate.body = req.body
          if ('query' in zodSchema.shape) dataToValidate.query = req.query
          if ('params' in zodSchema.shape) dataToValidate.params = req.params

          const result = await zodSchema.parseAsync(dataToValidate) as Record<string, unknown>

          if (result.body) req.body = result.body
          if (result.query) req.query = result.query as typeof req.query
          if (result.params) req.params = result.params as typeof req.params
        } else {
          // It's a simple schema - validate body only
          req.body = await schemaOrOptions.parseAsync(req.body)
        }
      } else {
        // It's an options object with separate schemas
        const schemas = schemaOrOptions as ValidateOptions

        if (schemas.body) {
          req.body = await schemas.body.parseAsync(req.body)
        }
        if (schemas.query) {
          req.query = await schemas.query.parseAsync(req.query)
        }
        if (schemas.params) {
          req.params = await schemas.params.parseAsync(req.params)
        }
      }

      next()
    } catch (error: unknown) {
      const zodError = error as { errors?: Array<{ message: string }> }
      const message = zodError.errors?.[0]?.message || 'Validation failed'
      next(new BadRequestError(message))
    }
  }
}
