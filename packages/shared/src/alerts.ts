import { Resend } from 'resend'

/**
 * Dispatches a system warning or budget alert email via Resend.
 * Fails gracefully by logging errors rather than throwing.
 */
export async function sendAlert(subject: string, body: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.ALERT_EMAIL

  if (!apiKey || !toEmail) {
    console.warn('[Alerts] RESEND_API_KEY or ALERT_EMAIL is missing in env. Skipping email dispatch.')
    return false
  }

  try {
    const resend = new Resend(apiKey)

    const response = await resend.emails.send({
      from: 'SnapForge Alerts <alerts@resend.dev>', // Resend sandbox default sender domain
      to: toEmail,
      subject: `[SnapForge Alert] ${subject}`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>System Alert</h2>
        <p>${body.replace(/\n/g, '<br/>')}</p>
        <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;"/>
        <small style="color: #666;">This is an automated system message from SnapForge.</small>
      </div>`
    })

    if (response.error) {
      console.error('[Alerts] Resend API error:', response.error.message)
      return false
    }

    console.log(`[Alerts] Alert email dispatched successfully to ${toEmail}`)
    return true
  } catch (error: any) {
    console.error('[Alerts] Failed to send alert email:', error.message)
    return false
  }
}


