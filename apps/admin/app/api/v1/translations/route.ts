import { handleRouteError } from '../../../../utils/error'
import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// GET /api/translations — list all translations with optional status filter
// Query params: ?status=qa_queue, ?status=published, ?articleId=uuid
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const articleId = searchParams.get('articleId')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    const cursor = searchParams.get('cursor') || undefined

    const translations = await DbService.getTranslations({ 
      status: status ?? undefined, 
      articleId: articleId ?? undefined,
      limit,
      cursor
    })
    
    const nextCursor = translations.length > 0 ? translations[translations.length - 1].created_at : null

    return NextResponse.json({ 
      success: true, 
      data: translations,
      pagination: {
        nextCursor,
        limit
      }
    })
  } catch (error: any) {
    return handleRouteError(error, 'translations/route.ts')
  }
}
