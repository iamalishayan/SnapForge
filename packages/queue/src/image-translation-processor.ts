import { DbService } from '@snapforge/db'
import {
  MIN_RENDER_CONFIDENCE,
  classifyImage,
  translateImageSlots,
  fetchImageAsBase64,
  hashImageBytes,
  extractLocalizableImages,
  fillTemplateSvg,
  renderSvgToPng,
  rewriteImageSrc,
  TEMPLATE_TYPES,
  type ImageClassification,
  type ImageOutcomeEntry,
  type TemplateType,
  type TranslatedSlot,
} from '@snapforge/ai'
import { logger } from '@snapforge/shared'

interface CachedResult {
  classification: ImageClassification
  translated_slots: TranslatedSlot[] | null
  rendered_url: string | null
}

/** Apply the locked routing rules to a classification. */
function routeClassification(
  classification: ImageClassification
): 'skipped_logo' | 'kept' | 'needs_review' | 'render' {
  if (classification.is_logo_or_branding) return 'skipped_logo'
  if (!classification.has_informational_text) return 'kept'
  if (
    classification.confidence < MIN_RENDER_CONFIDENCE ||
    classification.template_type === 'none' ||
    !(TEMPLATE_TYPES as readonly string[]).includes(classification.template_type)
  ) {
    return 'needs_review'
  }
  return 'render'
}

function outcomeFromCache(src: string, cached: CachedResult): ImageOutcomeEntry {
  const route = routeClassification(cached.classification)

  if (route === 'render' && cached.rendered_url) {
    return {
      src,
      status: 'rendered',
      template_type: cached.classification.template_type,
      confidence: cached.classification.confidence,
      extracted_text: cached.classification.extracted_text,
      slots: cached.translated_slots ?? undefined,
      rendered_src: cached.rendered_url,
      cached: true,
    }
  }

  return {
    src,
    status: route === 'render' ? 'needs_review' : route,
    template_type: cached.classification.template_type,
    confidence: cached.classification.confidence,
    extracted_text: cached.classification.extracted_text,
    cached: true,
  }
}

async function processSingleImage(
  src: string,
  translationId: string,
  targetLanguage: string,
  countryCode: string
): Promise<ImageOutcomeEntry> {
  let base64: string
  let mimeType: string
  try {
    ;({ base64, mimeType } = await fetchImageAsBase64(src))
  } catch (err) {
    return {
      src,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Image fetch failed',
    }
  }

  const imageHash = hashImageBytes(base64)

  const cachedRow = await DbService.getImageTranslationCache(imageHash, targetLanguage)
  if (cachedRow?.classification) {
    return outcomeFromCache(src, {
      classification: cachedRow.classification as unknown as ImageClassification,
      translated_slots: cachedRow.translated_slots as unknown as TranslatedSlot[] | null,
      rendered_url: cachedRow.rendered_url,
    })
  }

  const classification = await classifyImage(base64, mimeType)
  const route = routeClassification(classification)

  if (route !== 'render') {
    await DbService.saveImageTranslationCache({
      image_hash: imageHash,
      target_locale: targetLanguage,
      classification: classification as any,
    })
    return {
      src,
      status: route,
      template_type: classification.template_type,
      confidence: classification.confidence,
      extracted_text: classification.extracted_text,
    }
  }

  const templateType = classification.template_type as TemplateType
  const translatedSlots = await translateImageSlots(
    classification.slots,
    targetLanguage,
    countryCode
  )

  const slotMap: Record<string, string> = {}
  for (const slot of translatedSlots) {
    slotMap[slot.name] = slot.translated
  }

  const svg = fillTemplateSvg(templateType, slotMap, targetLanguage)
  const png = await renderSvgToPng(svg, targetLanguage)
  const storagePath = `translations/${translationId}/${imageHash}.png`
  const renderedUrl = await DbService.uploadTranslatedImage(storagePath, png)

  await DbService.saveImageTranslationCache({
    image_hash: imageHash,
    target_locale: targetLanguage,
    classification: classification as any,
    translated_slots: translatedSlots as any,
    rendered_url: renderedUrl,
  })

  return {
    src,
    status: 'rendered',
    template_type: templateType,
    confidence: classification.confidence,
    extracted_text: classification.extracted_text,
    slots: translatedSlots,
    rendered_src: renderedUrl,
  }
}

/**
 * Full image localization pass for one translation:
 * classify each image, render templates for informational text,
 * rewrite src in translated content, and persist outcomes.
 */
export async function processImageTranslation(
  translationId: string,
  requestId?: string
): Promise<{ entries: ImageOutcomeEntry[]; needsReview: boolean }> {
  const translation = await DbService.getTranslationById(translationId)
  if (!translation) {
    throw new Error(`Translation ${translationId} not found.`)
  }

  const targetLanguage = translation.language_code
  const countryCode = translation.country_code
  let content = translation.translated_content || ''

  const images = extractLocalizableImages(content)
  if (images.length === 0) {
    await DbService.updateTranslation(translationId, {
      image_texts: [],
      image_translation_needed: false,
    })
    return { entries: [], needsReview: false }
  }

  const entries: ImageOutcomeEntry[] = []
  for (const { src, originalSrc } of images) {
    const entry = await processSingleImage(originalSrc, translationId, targetLanguage, countryCode)
    entries.push(entry)

    if (entry.status === 'rendered' && entry.rendered_src && entry.rendered_src !== src) {
      content = rewriteImageSrc(content, src, entry.rendered_src, originalSrc)
    }

    logger.info(
      { requestId, translationId, src: originalSrc, status: entry.status, cached: entry.cached ?? false },
      'Image localization outcome'
    )
  }

  const needsReview = entries.some(
    (entry) => entry.status === 'needs_review' || entry.status === 'failed'
  )

  await DbService.updateTranslation(translationId, {
    image_texts: entries as any,
    image_translation_needed: needsReview,
    translated_content: content,
  })

  return { entries, needsReview }
}
