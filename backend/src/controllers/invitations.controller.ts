import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { sendInvitationEmail } from '../services/email.service.js'

interface CreateInvitationBody {
  email: string
  role?: 'admin_tenant' | 'user_tenant'
  tenant_id?: string
}

/**
 * Create a new invitation
 * - Superadmin can invite to any tenant with any role
 * - Admin tenant can only invite user_tenant to their own tenant
 */
export async function createInvitation(
  req: Request<unknown, unknown, CreateInvitationBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, role = 'user_tenant' } = req.body
    const user = req.user!

    if (!email) {
      throw new BadRequestError('Email e obrigatorio')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Email invalido')
    }

    // Determine tenant_id
    let targetTenantId = user.tenant_id

    // For superadmin, allow specifying tenant_id in body
    if (user.role === 'superadmin' && req.body.tenant_id) {
      targetTenantId = req.body.tenant_id
    }

    if (!targetTenantId) {
      throw new BadRequestError('Tenant nao especificado')
    }

    // Admin tenant can only invite user_tenant role
    if (user.role === 'admin_tenant' && role !== 'user_tenant') {
      throw new ForbiddenError('Voce so pode convidar usuarios com role user_tenant')
    }

    // Check if user already exists in this tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('tenant_id', targetTenantId)
      .single()

    if (existingUser) {
      throw new BadRequestError('Este usuario ja faz parte desta empresa')
    }

    // Check for pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, expires_at')
      .eq('email', email)
      .eq('tenant_id', targetTenantId)
      .is('accepted_at', null)
      .single()

    if (existingInvitation) {
      // Check if expired
      if (new Date(existingInvitation.expires_at) > new Date()) {
        throw new BadRequestError('Ja existe um convite pendente para este email')
      }
      // Delete expired invitation
      await supabase.from('invitations').delete().eq('id', existingInvitation.id)
    }

    // Check tenant user limit
    const { data: tenant } = await supabase
      .from('tenants')
      .select('max_users')
      .eq('id', targetTenantId)
      .single()

    if (tenant) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', targetTenantId)

      if (count && count >= tenant.max_users) {
        throw new BadRequestError(`Limite de ${tenant.max_users} usuarios atingido para esta empresa`)
      }
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        email,
        tenant_id: targetTenantId,
        role,
        invited_by: user.id
      })
      .select('id, email, role, token, expires_at, created_at')
      .single()

    if (error) {
      logger.error('Failed to create invitation', { error })
      throw new BadRequestError('Falha ao criar convite')
    }

    logger.info('Invitation created', {
      invitationId: invitation.id,
      email,
      tenantId: targetTenantId,
      invitedBy: user.id
    })

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invitation.token}`

    // Send invitation email (non-blocking — failure doesn't affect response)
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', targetTenantId)
      .single()

    sendInvitationEmail({
      to: email,
      inviteUrl,
      tenantName: tenantData?.name || 'a empresa',
      role,
      invitedByName: user.full_name || user.email,
    }).catch(() => {}) // fire and forget

    res.status(201).json({
      message: 'Convite criado com sucesso',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * List invitations for the current tenant
 */
export async function listInvitations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!
    let query = supabase
      .from('invitations')
      .select('id, email, role, expires_at, accepted_at, created_at, invited_by')
      .order('created_at', { ascending: false })

    // Superadmin can see all, admin sees only their tenant
    if (user.role !== 'superadmin') {
      query = query.eq('tenant_id', user.tenant_id)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to list invitations', { error })
      throw new BadRequestError('Falha ao listar convites')
    }

    res.json({
      invitations: data?.map(inv => ({
        ...inv,
        status: inv.accepted_at
          ? 'accepted'
          : new Date(inv.expires_at) < new Date()
            ? 'expired'
            : 'pending'
      }))
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel/delete an invitation
 */
export async function cancelInvitation(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params
    const user = req.user!

    // Get invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, tenant_id, accepted_at')
      .eq('id', id)
      .single()

    if (error || !invitation) {
      throw new NotFoundError('Convite nao encontrado')
    }

    // Check permissions
    if (user.role !== 'superadmin' && invitation.tenant_id !== user.tenant_id) {
      throw new ForbiddenError('Sem permissao para cancelar este convite')
    }

    if (invitation.accepted_at) {
      throw new BadRequestError('Este convite ja foi aceito')
    }

    // Delete invitation
    await supabase.from('invitations').delete().eq('id', id)

    logger.info('Invitation cancelled', { invitationId: id, cancelledBy: user.id })

    res.json({ message: 'Convite cancelado com sucesso' })
  } catch (error) {
    next(error)
  }
}

/**
 * Validate invitation token (public endpoint)
 */
export async function validateInvitation(
  req: Request<{ token: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { token } = req.params

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        tenant:tenant_id(id, name)
      `)
      .eq('token', token)
      .single()

    if (error || !invitation) {
      throw new NotFoundError('Convite invalido ou nao encontrado')
    }

    if (invitation.accepted_at) {
      throw new BadRequestError('Este convite ja foi utilizado')
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestError('Este convite expirou')
    }

    const tenantData = invitation.tenant as unknown as { id: string; name: string } | null
    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        tenant_name: tenantData?.name,
        expires_at: invitation.expires_at
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Resend invitation email
 */
export async function resendInvitation(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params
    const user = req.user!

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, email, role, tenant_id, expires_at, accepted_at, token')
      .eq('id', id)
      .single()

    if (error || !invitation) {
      throw new NotFoundError('Convite nao encontrado')
    }

    if (user.role !== 'superadmin' && invitation.tenant_id !== user.tenant_id) {
      throw new ForbiddenError('Sem permissao para reenviar este convite')
    }

    if (invitation.accepted_at) {
      throw new BadRequestError('Este convite ja foi aceito')
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestError('Este convite expirou. Cancele e crie um novo.')
    }

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invitation.token}`

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', invitation.tenant_id)
      .single()

    await sendInvitationEmail({
      to: invitation.email,
      inviteUrl,
      tenantName: tenantData?.name || 'a empresa',
      role: invitation.role,
      invitedByName: user.full_name || user.email,
    })

    logger.info('Invitation resent', { invitationId: id, resentBy: user.id })

    res.json({ message: 'Email de convite reenviado com sucesso' })
  } catch (error) {
    next(error)
  }
}

/**
 * Accept invitation and create user account
 */
export async function acceptInvitation(
  req: Request<{ token: string }, unknown, { password: string; full_name?: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { token } = req.params
    const { password, full_name } = req.body

    if (!password || password.length < 6) {
      throw new BadRequestError('Senha deve ter no minimo 6 caracteres')
    }

    // Get invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, email, role, tenant_id, expires_at, accepted_at, invited_by')
      .eq('token', token)
      .single()

    if (error || !invitation) {
      throw new NotFoundError('Convite invalido ou nao encontrado')
    }

    if (invitation.accepted_at) {
      throw new BadRequestError('Este convite ja foi utilizado')
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestError('Este convite expirou')
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true // Auto-confirm email since they have a valid invite
    })

    if (authError) {
      logger.error('Failed to create auth user', { error: authError })

      // Check if user already exists in auth
      if (authError.message?.includes('already been registered')) {
        throw new BadRequestError('Este email ja esta registrado. Faca login com sua senha existente.')
      }

      throw new BadRequestError('Falha ao criar conta: ' + authError.message)
    }

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: invitation.email,
        full_name: full_name || invitation.email.split('@')[0],
        tenant_id: invitation.tenant_id,
        role: invitation.role,
        invited_by: invitation.invited_by
      })

    if (userError) {
      logger.error('Failed to create user record', { error: userError })
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new BadRequestError('Falha ao criar registro de usuario')
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    logger.info('Invitation accepted', {
      invitationId: invitation.id,
      userId: authData.user.id,
      email: invitation.email
    })

    res.json({
      message: 'Conta criada com sucesso! Voce ja pode fazer login.',
      email: invitation.email
    })
  } catch (error) {
    next(error)
  }
}
