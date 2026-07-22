import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

// POST /api/qa/flag — Flags a translation and stores reviewer notes/reasons
export async function POST(request: Request) {
  try {
    const { translationId, reviewerNotes } = await request.json()

    if (!translationId || !reviewerNotes) {
      return NextResponse.json({ success: false, error: 'Missing parameters.' }, { status: 400 })
    }

    // Update status to flagged with notes
    await DbService.updateTranslationStatus(translationId, 'flagged', reviewerNotes)

    return NextResponse.json({ success: true, message: 'Translation successfully flagged.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

