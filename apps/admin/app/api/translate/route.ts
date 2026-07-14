// POST /api/translate — fans out translation jobs to all active sites for a given articleId, respects p-limit concurrency
export async function POST(request: Request) {
  return Response.json({ todo: 'implement translation fan-out' })
}
