import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'

// POST /api/qa/approve — Approves a translation, updates DB status, and triggers revalidation job
export async function POST(request: Request) {
  try {
    const { translationId, domain, templateSlug, reviewerNotes } = await request.json() as {
      translationId: string
      domain: string
      templateSlug: string
      reviewerNotes?: string
    }


    if (!translationId || !domain || !templateSlug) {
      return NextResponse.json({ success: false, error: 'Missing parameters.' }, { status: 400 })
    }

    // 1. Update translation status to qa_approved
    await DbService.updateTranslationStatus(translationId, 'qa_approved', reviewerNotes)

    // 2. Add revalidation job (BullMQ rejects colons in custom jobIds — use ___ instead)
    const jobId = `revalidate___${translationId}`
    await (revalidationQueue as any).add(
      'revalidate',
      { domain, templateSlug },
      { jobId }
    )



    return NextResponse.json({ success: true, message: 'Translation approved and revalidation queued.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

