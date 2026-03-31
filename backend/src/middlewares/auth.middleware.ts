import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { UnauthorizedError } from '../utils/errors.js'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        workspace_id: string
        role: string
      }
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      throw new UnauthorizedError('No token provided')
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new UnauthorizedError('Invalid token')
    }

    // Get user with workspace
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, workspace_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new UnauthorizedError('User not found')
    }

    req.user = userData
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Optional auth - sets user if token present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, workspace_id, role')
          .eq('id', user.id)
          .single()

        if (userData) {
          req.user = userData
        }
      }
    }

    next()
  } catch {
    // Ignore errors, just continue without user
    next()
  }
}
