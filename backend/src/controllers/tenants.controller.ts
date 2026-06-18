import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

interface CreateTenantBody {
  name: string
  slug?: string
  plan?: string
  max_users?: number
}

interface UpdateTenantBody {
  name?: string
  plan?: string
  max_users?: number
  is_active?: boolean
}

/**
 * List all tenants (superadmin only)
 */
export async function listTenants(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        slug,
        plan,
        max_users,
        is_active,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to list tenants', { error })
      throw new BadRequestError('Falha ao listar empresas')
    }

    // Get user counts for each tenant
    const tenantsWithCounts = await Promise.all(
      (data || []).map(async (tenant) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        return {
          ...tenant,
          user_count: count || 0
        }
      })
    )

    res.json({ tenants: tenantsWithCounts })
  } catch (error) {
    next(error)
  }
}

/**
 * Get tenant details (superadmin only)
 */
export async function getTenant(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !tenant) {
      throw new NotFoundError('Empresa nao encontrada')
    }

    // Get users
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })

    res.json({
      tenant: {
        ...tenant,
        users: users || []
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new tenant (superadmin only)
 */
export async function createTenant(
  req: Request<unknown, unknown, CreateTenantBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, slug, plan = 'free', max_users = 5 } = req.body

    if (!name) {
      throw new BadRequestError('Nome e obrigatorio')
    }

    // Generate slug from name if not provided
    const tenantSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (existing) {
      throw new BadRequestError('Ja existe uma empresa com este identificador')
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name,
        slug: tenantSlug,
        plan,
        max_users
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create tenant', { error })
      throw new BadRequestError('Falha ao criar empresa')
    }

    logger.info('Tenant created', { tenantId: tenant.id, name })

    res.status(201).json({ tenant })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a tenant (superadmin only)
 */
export async function updateTenant(
  req: Request<{ id: string }, unknown, UpdateTenantBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params
    const updates = req.body

    // Check tenant exists
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      throw new NotFoundError('Empresa nao encontrada')
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update tenant', { error })
      throw new BadRequestError('Falha ao atualizar empresa')
    }

    logger.info('Tenant updated', { tenantId: id, updates })

    res.json({ tenant })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a tenant (superadmin only)
 * This will cascade delete all related data
 */
export async function deleteTenant(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params

    // Check tenant exists
    const { data: existing } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existing) {
      throw new NotFoundError('Empresa nao encontrada')
    }

    // Get all users to delete from auth
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', id)

    // Delete users from auth
    if (users && users.length > 0) {
      for (const user of users) {
        await supabase.auth.admin.deleteUser(user.id)
      }
    }

    // Delete tenant (cascade will handle related data)
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete tenant', { error })
      throw new BadRequestError('Falha ao excluir empresa')
    }

    logger.info('Tenant deleted', { tenantId: id, name: existing.name })

    res.json({ message: 'Empresa excluida com sucesso' })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a new tenant with its admin user in a single atomic operation (superadmin only)
 */
export async function createTenantWithAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let authUserId: string | undefined
  let tenantId: string | undefined

  try {
    const {
      tenant_name,
      tenant_plan = 'free',
      tenant_max_users = 5,
      admin_email,
      admin_password,
      admin_full_name
    } = req.body

    if (!tenant_name || !admin_email || !admin_password) {
      throw new BadRequestError('Nome da empresa, email e senha do administrador são obrigatórios')
    }

    if (admin_password.length < 6) {
      throw new BadRequestError('Senha deve ter no mínimo 6 caracteres')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(admin_email)) {
      throw new BadRequestError('Email inválido')
    }

    // Generate slug
    const tenantSlug = tenant_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const { data: existingSlug } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (existingSlug) {
      throw new BadRequestError('Já existe uma empresa com este nome')
    }

    // Check if email already in use
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', admin_email)
      .single()

    if (existingUser) {
      throw new BadRequestError('Este email já está em uso')
    }

    // Step 1: Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenant_name,
        slug: tenantSlug,
        plan: tenant_plan,
        max_users: tenant_max_users
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      logger.error('Failed to create tenant', { error: tenantError })
      throw new BadRequestError('Falha ao criar empresa')
    }

    tenantId = tenant.id

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      logger.error('Failed to create auth user', { error: authError })
      await supabase.from('tenants').delete().eq('id', tenantId)
      if (authError?.message?.includes('already been registered')) {
        throw new BadRequestError('Este email já está registrado no sistema de autenticação')
      }
      throw new BadRequestError('Falha ao criar usuário: ' + authError?.message)
    }

    authUserId = authData.user.id

    // Step 3: Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: admin_email,
        full_name: admin_full_name || admin_email.split('@')[0],
        tenant_id: tenant.id,
        role: 'admin_tenant'
      })

    if (userError) {
      logger.error('Failed to create user record', { error: userError })
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from('tenants').delete().eq('id', tenantId)
      throw new BadRequestError('Falha ao criar registro do usuário')
    }

    logger.info('Tenant with admin created', {
      tenantId: tenant.id,
      adminId: authUserId,
      createdBy: req.user!.id
    })

    res.status(201).json({
      message: 'Empresa e administrador criados com sucesso',
      tenant: {
        ...tenant,
        admin: {
          id: authUserId,
          email: admin_email,
          full_name: admin_full_name || admin_email.split('@')[0],
          role: 'admin_tenant'
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get dashboard stats for superadmin
 */
export async function getSuperadminDashboard(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Total tenants
    const { count: totalTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    // Active tenants
    const { count: activeTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Users by role
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role')

    const roleStats = {
      superadmin: 0,
      admin_tenant: 0,
      user_tenant: 0
    }

    usersByRole?.forEach(u => {
      if (u.role in roleStats) {
        roleStats[u.role as keyof typeof roleStats]++
      }
    })

    // Tenants by plan
    const { data: tenantsByPlan } = await supabase
      .from('tenants')
      .select('plan')

    const planStats: Record<string, number> = {}
    tenantsByPlan?.forEach(t => {
      planStats[t.plan] = (planStats[t.plan] || 0) + 1
    })

    res.json({
      stats: {
        total_tenants: totalTenants || 0,
        active_tenants: activeTenants || 0,
        total_users: totalUsers || 0,
        users_by_role: roleStats,
        tenants_by_plan: planStats
      }
    })
  } catch (error) {
    next(error)
  }
}
