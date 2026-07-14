// POST /api/webhooks/translation-approved — receives Supabase DB webhook when status = qa_approved, triggers ISR + IndexNow
export async function POST(request: Request) {
  return Response.json({ todo: 'implement webhook handler' })
}
