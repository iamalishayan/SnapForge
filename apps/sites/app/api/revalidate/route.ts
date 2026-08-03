// POST /api/revalidate — on-demand ISR revalidation triggered after QA approval, validates REVALIDATION_SECRET header
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidation-secret')
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ success: false, error: 'Invalid secret' }, { status: 401 })
  }

  const { templateSlug, articleSlug, domain } = await request.json()
  
  // Revalidate the specific article path
  revalidatePath(`/${templateSlug}/${articleSlug}`)
  
  // Also revalidate the homepage so the new article shows up
  revalidatePath('/')

  return Response.json({ success: true, revalidated: true, path: `/${templateSlug}/${articleSlug}` })
}
