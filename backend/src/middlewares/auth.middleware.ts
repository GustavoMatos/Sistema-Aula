import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { UnauthorizedError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

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
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, workspace_id, role')
      .eq('id', user.id)
      .single()

    // If user doesn't exist in users table, create workspace and user
    if (userError || !userData) {
      logger.info('Creating workspace and user for new auth user', { userId: user.id, email: user.email })

      // Create workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name: user.email?.split('@')[0] || 'Meu Workspace' })
        .select()
        .single()

      if (wsError || !workspace) {
        logger.error('Failed to create workspace', { error: wsError })
        throw new UnauthorizedError('Failed to setup user workspace')
      }

      // Create user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          workspace_id: workspace.id,
          role: 'admin'
        })
        .select('id, email, workspace_id, role')
        .single()

      if (createError || !newUser) {
        logger.error('Failed to create user record', { error: createError })
        throw new UnauthorizedError('Failed to setup user')
      }

      userData = newUser
      logger.info('User and workspace created successfully', { userId: user.id, workspaceId: workspace.id })
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
