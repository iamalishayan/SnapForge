// POST /api/publish/kill — emergency kill switch: sets status to flagged + triggers ISR revalidation to 404
export async function POST(request: Request) {
  return Response.json({ todo: 'implement kill switch' })
}
