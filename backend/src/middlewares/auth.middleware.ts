import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

// Role types matching database enum
export type UserRole = 'superadmin' | 'admin_tenant' | 'user_tenant'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        tenant_id: string
        role: UserRole
        full_name?: string
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

    // Get user with tenant
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, tenant_id, role, full_name')
      .eq('id', user.id)
      .single()

    // User must exist in users table (created via invitation flow)
    if (userError || !userData) {
      logger.warn('User not found in users table - must be invited first', { userId: user.id, email: user.email })
      throw new UnauthorizedError('Usuário não encontrado. Você precisa ser convidado por um administrador.')
    }

    // Check if user is active
    const { data: fullUser } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (fullUser && fullUser.is_active === false) {
      throw new UnauthorizedError('Sua conta foi desativada. Entre em contato com o administrador.')
    }

    req.user = userData as {
      id: string
      email: string
      tenant_id: string
      role: UserRole
      full_name?: string
    }
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
          .select('id, email, tenant_id, role, full_name')
          .eq('id', user.id)
          .single()

        if (userData) {
          req.user = userData as {
            id: string
            email: string
            tenant_id: string
            role: UserRole
            full_name?: string
          }
        }
      }
    }

    next()
  } catch {
    // Ignore errors, just continue without user
    next()
  }
}

/**
 * Middleware factory to require specific roles
 * Usage: requireRole('superadmin') or requireRole('admin_tenant', 'superadmin')
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      })
      return next(new ForbiddenError('Você não tem permissão para acessar este recurso'))
    }

    next()
  }
}

/**
 * Middleware to require superadmin role
 */
export const requireSuperadmin = requireRole('superadmin')

/**
 * Middleware to require at least admin_tenant role
 */
export const requireAdmin = requireRole('superadmin', 'admin_tenant')

/**
 * Middleware to ensure user can only access their own tenant's data
 * Used after authMiddleware for tenant-scoped operations
 */
export function requireTenantAccess(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'))
  }

  // Superadmins can access any tenant
  if (req.user.role === 'superadmin') {
    return next()
  }

  // For tenant-scoped users, tenant_id is required
  if (!req.user.tenant_id) {
    logger.warn('User without tenant_id trying to access tenant resource', { userId: req.user.id })
    return next(new ForbiddenError('Usuário não está associado a nenhuma empresa'))
  }

  next()
}
