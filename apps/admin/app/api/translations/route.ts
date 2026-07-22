import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

// GET /api/translations — list all translations with optional status filter
// Query params: ?status=qa_queue, ?status=published, ?articleId=uuid
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const articleId = searchParams.get('articleId')

    const translations = await DbService.getTranslations({ status: status ?? undefined, articleId: articleId ?? undefined })
    return NextResponse.json({ success: true, data: translations })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
