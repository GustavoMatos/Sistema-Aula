import { Resend } from 'resend'
import { logger } from '../utils/logger.js'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_NAME = process.env.APP_NAME || 'Lead Tracker A.W.A Capital'

export async function sendInvitationEmail({
  to,
  inviteUrl,
  tenantName,
  role,
  invitedByName,
}: {
  to: string
  inviteUrl: string
  tenantName: string
  role: string
  invitedByName?: string
}): Promise<void> {
  const resendClient = getResend()
  if (!resendClient) {
    logger.warn('RESEND_API_KEY not set — skipping email send')
    return
  }

  const roleLabel = role === 'admin_tenant' ? 'Administrador' : 'Usuário'
  const invitedBy = invitedByName || 'Um administrador'

  const { error } = await resendClient.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Você foi convidado para ${tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 32px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #3b82f6; margin-top: 0;">${APP_NAME}</h2>
            <p style="color: #374151; font-size: 16px;">Olá!</p>
            <p style="color: #374151; font-size: 16px;">
              <strong>${invitedBy}</strong> convidou você para fazer parte de <strong>${tenantName}</strong> como <strong>${roleLabel}</strong>.
            </p>
            <p style="color: #374151; font-size: 16px;">
              Clique no botão abaixo para criar sua conta e acessar o sistema:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteUrl}"
                style="background: #3b82f6; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px;">
              Este link expira em 7 dias. Se você não esperava este convite, pode ignorar este email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">${APP_NAME}</p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    logger.error(`Failed to send invitation email: ${JSON.stringify(error)}`)
  } else {
    logger.info('Invitation email sent', { to, tenantName })
  }
}
