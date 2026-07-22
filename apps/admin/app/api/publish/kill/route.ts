import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'

// POST /api/publish/kill — Emergency unpublish action: flags translation and queues revalidation task
export async function POST(request: Request) {
  try {
    const { translationId, domain, templateSlug, reason } = await request.json() as {
      translationId: string
      domain: string
      templateSlug: string
      reason?: string
    }


    if (!translationId || !domain || !templateSlug) {
      return NextResponse.json({ success: false, error: 'Missing parameters.' }, { status: 400 })
    }

    // 1. Instantly demote status to flagged
    await DbService.updateTranslationStatus(
      translationId, 
      'flagged', 
      reason || 'Emergency unpublish triggered.'
    )

    // 2. Queue revalidation task to strip live cached version
    const jobId = `kill___${translationId}`
    await (revalidationQueue as any).add(
      'revalidate',
      { domain, templateSlug },
      { jobId }
    )



    return NextResponse.json({ success: true, message: 'Emergency kill switch completed.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

