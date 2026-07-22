import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { translationQueue } from '@snapforge/queue'

// POST /api/qa/retry — Re-queues a translation job for a specific flagged translation
export async function POST(request: Request) {
  try {
    const { translationId } = await request.json()
    
    if (!translationId) {
      return NextResponse.json({ success: false, error: 'Missing translationId parameter.' }, { status: 400 })
    }

    // 1. Fetch the existing translation to get the article and site IDs
    const translation = await DbService.getTranslationById(translationId)
    if (!translation) {
      return NextResponse.json({ success: false, error: 'Translation not found.' }, { status: 404 })
    }

    // 2. Reset the status to 'staging' to clear the 'flagged' state
    await DbService.updateTranslationStatus(
      translationId, 
      'staging', 
      'Re-queued for translation by QA retry endpoint.'
    )

    // Extract keywords safely for TypeScript
    const keywords = Array.isArray(translation.target_keywords) 
      ? (translation.target_keywords as string[]) 
      : []
    const primaryKeyword = keywords.length > 0 ? keywords[0] : ''
    const secondaryKeywords = keywords.length > 1 ? keywords.slice(1) : []

    // 3. Re-queue the translation job in BullMQ
    // The worker will upsert and overwrite this existing row when finished
    const jobId = `${translation.article_id}___${translation.site_config_id}`
    await (translationQueue as any).add('translate', {
      articleId: translation.article_id,
      siteConfigId: translation.site_config_id,
      targetLanguage: translation.language_code,
      countryCode: translation.country_code,
      primaryKeyword,
      secondaryKeywords
    }, {
      jobId,
      removeOnComplete: true,
      removeOnFail: false
    })

    return NextResponse.json({ success: true, message: 'Translation successfully re-queued.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
