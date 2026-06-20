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

export async function sendMeetingInviteEmail({
  to,
  leadName,
  leadPhone,
  meetingDate,
  advisorName,
  notes,
}: {
  to: string
  leadName: string
  leadPhone: string
  meetingDate: Date
  advisorName?: string
  notes?: string
}): Promise<void> {
  const resendClient = getResend()
  if (!resendClient) {
    logger.warn('RESEND_API_KEY not set — skipping meeting invite email')
    return
  }

  const advisor = advisorName || 'Assessor'
  const dateStr = meetingDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = meetingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const endDate = new Date(meetingDate.getTime() + 60 * 60 * 1000)

  const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//A.W.A Capital//Lead Tracker//PT',
    'BEGIN:VEVENT',
    `DTSTART:${formatICS(meetingDate)}`,
    `DTEND:${formatICS(endDate)}`,
    `SUMMARY:Reunião com ${leadName} - A.W.A Capital`,
    `DESCRIPTION:Lead qualificado pelo SDR automatico.\\nTelefone: ${leadPhone}\\n${notes ? 'Notas: ' + notes : ''}`,
    `ORGANIZER:mailto:${FROM_EMAIL}`,
    `ATTENDEE:mailto:${to}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const icsBase64 = Buffer.from(icsContent).toString('base64')

  const { error } = await resendClient.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reunião agendada: ${leadName} — Lead Qualificado A.W.A Capital`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Sora', Arial, sans-serif; background: #f7f7f7; padding: 32px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #002370; margin-top: 0;">A.W.A Capital — Lead Qualificado</h2>
            <p style="color: #374151; font-size: 16px;">Olá ${advisor},</p>
            <p style="color: #374151; font-size: 16px;">
              Um novo lead foi <strong style="color: #feb202;">qualificado</strong> pelo assistente SDR e uma reunião foi agendada.
            </p>
            <div style="background: #f0f4ff; border-left: 4px solid #002370; padding: 16px; border-radius: 4px; margin: 24px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Lead:</strong> ${leadName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Telefone:</strong> ${leadPhone}</p>
              <p style="margin: 0 0 8px 0;"><strong>Data:</strong> ${dateStr}</p>
              <p style="margin: 0 0 8px 0;"><strong>Horário:</strong> ${timeStr}</p>
              ${notes ? `<p style="margin: 0;"><strong>Observações:</strong> ${notes}</p>` : ''}
            </div>
            <p style="color: #374151; font-size: 14px;">
              O convite de calendário está anexo a este email. Aceite para adicionar à sua agenda.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">${APP_NAME}</p>
          </div>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: 'reuniao.ics',
        content: icsBase64,
      },
    ],
  })

  if (error) {
    logger.error(`Failed to send meeting invite email: ${JSON.stringify(error)}`)
  } else {
    logger.info('Meeting invite email sent', { to, leadName, meetingDate: meetingDate.toISOString() })
  }
}
