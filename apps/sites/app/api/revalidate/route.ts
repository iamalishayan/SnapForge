// POST /api/revalidate — on-demand ISR revalidation triggered after QA approval, validates REVALIDATION_SECRET header
export async function POST(request: Request) {
  return Response.json({ todo: 'implement ISR revalidation' })
}
