// POST /api/qa/flag — sets translation status to flagged with a reason, blocks it from publish queue
export async function POST(request: Request) {
  return Response.json({ todo: 'implement QA flagging' })
}
