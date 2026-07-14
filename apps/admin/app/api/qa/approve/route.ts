// POST /api/qa/approve — sets translation status to qa_approved, triggers webhook for ISR + IndexNow
export async function POST(request: Request) {
  return Response.json({ todo: 'implement QA approval' })
}
