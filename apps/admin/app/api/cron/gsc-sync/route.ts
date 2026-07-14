// GET /api/cron/gsc-sync — Vercel cron job (daily 9am UTC) that syncs GSC data per site and sends manual action alerts
export async function GET() {
  return Response.json({ todo: 'implement GSC daily sync' })
}
