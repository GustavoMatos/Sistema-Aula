import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * List users in the current tenant
 */
export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false })

    // Filter by tenant for non-superadmins
    if (user.role !== 'superadmin') {
      query = query.eq('tenant_id', user.tenant_id)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to list users', { error })
      throw new BadRequestError('Falha ao listar usuarios')
    }

    res.json({ users: data })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user's profile
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        tenant:tenant_id(id, name, slug, plan)
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      logger.error('Failed to get user profile', { error })
      throw new BadRequestError('Falha ao obter perfil')
    }

    res.json({ user: data })
  } catch (error) {
    next(error)
  }
}

/**
 * Update current user's profile
 */
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!
    const { full_name } = req.body

    const { data, error } = await supabase
      .from('users')
      .update({ full_name })
      .eq('id', user.id)
      .select('id, email, full_name, role')
      .single()

    if (error) {
      logger.error('Failed to update profile', { error })
      throw new BadRequestError('Falha ao atualizar perfil')
    }

    res.json({ user: data })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a user (admin only)
 */
export async function updateUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params
    const currentUser = req.user!
    const { full_name, role, is_active } = req.body

    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, tenant_id, role')
      .eq('id', id)
      .single()

    if (fetchError || !targetUser) {
      throw new NotFoundError('Usuario nao encontrado')
    }

    // Permission checks
    if (currentUser.role !== 'superadmin') {
      // Admin can only modify users in their tenant
      if (targetUser.tenant_id !== currentUser.tenant_id) {
        throw new ForbiddenError('Sem permissao para modificar este usuario')
      }

      // Admin cannot modify superadmins
      if (targetUser.role === 'superadmin') {
        throw new ForbiddenError('Sem permissao para modificar superadmin')
      }

      // Admin cannot promote to admin_tenant
      if (role && role !== 'user_tenant') {
        throw new ForbiddenError('Voce so pode definir role como user_tenant')
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (role !== undefined) updates.role = role
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, role, is_active')
      .single()

    if (error) {
      logger.error('Failed to update user', { error })
      throw new BadRequestError('Falha ao atualizar usuario')
    }

    logger.info('User updated', { userId: id, updatedBy: currentUser.id, updates })

    res.json({ user: data })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete/deactivate a user (admin only)
 */
export async function deleteUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params
    const currentUser = req.user!
    const hardDelete = req.query.hard === 'true'

    // Cannot delete yourself
    if (id === currentUser.id) {
      throw new BadRequestError('Voce nao pode excluir sua propria conta')
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, tenant_id, role, email')
      .eq('id', id)
      .single()

    if (fetchError || !targetUser) {
      throw new NotFoundError('Usuario nao encontrado')
    }

    // Permission checks
    if (currentUser.role !== 'superadmin') {
      if (targetUser.tenant_id !== currentUser.tenant_id) {
        throw new ForbiddenError('Sem permissao para excluir este usuario')
      }
      if (targetUser.role === 'superadmin' || targetUser.role === 'admin_tenant') {
        throw new ForbiddenError('Sem permissao para excluir administradores')
      }
    }

    if (hardDelete && currentUser.role === 'superadmin') {
      // Hard delete - remove from auth and database
      await supabase.auth.admin.deleteUser(id)
      await supabase.from('users').delete().eq('id', id)
      logger.info('User hard deleted', { userId: id, deletedBy: currentUser.id })
    } else {
      // Soft delete - just deactivate
      await supabase.from('users').update({ is_active: false }).eq('id', id)
      logger.info('User deactivated', { userId: id, deactivatedBy: currentUser.id })
    }

    res.json({ message: hardDelete ? 'Usuario excluido' : 'Usuario desativado' })
  } catch (error) {
    next(error)
  }
}
