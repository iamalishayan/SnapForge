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

async function renderAndUpload(
  translationId: string,
  imageHash: string,
  templateType: TemplateType,
  translatedSlots: TranslatedSlot[],
  targetLanguage: string,
  classification: ImageClassification,
  src: string
): Promise<ImageOutcomeEntry> {
  const slotMap: Record<string, string> = {}
  for (const slot of translatedSlots) {
    slotMap[slot.name] = slot.translated
  }

  const svg = fillTemplateSvg(templateType, slotMap, targetLanguage)
  const png = await renderSvgToPng(svg, targetLanguage)
  // Bust CDN/browser cache: unique path per render
  const storagePath = `translations/${translationId}/${imageHash}-${Date.now()}.png`
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

async function processSingleImage(
  src: string,
  translationId: string,
  targetLanguage: string,
  countryCode: string,
  forceRefresh = false
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

  const cachedRow = forceRefresh
    ? null
    : await DbService.getImageTranslationCache(imageHash, targetLanguage)

  if (cachedRow?.classification) {
    const classification = cachedRow.classification as unknown as ImageClassification
    const route = routeClassification(classification)

    // Non-render routes can reuse cache as-is.
    if (route !== 'render') {
      return {
        src,
        status: route,
        template_type: classification.template_type,
        confidence: classification.confidence,
        extracted_text: classification.extracted_text,
        cached: true,
      }
    }

    // Always re-rasterize PNG so font/config fixes apply. Reuse VLM slots.
    const templateType = classification.template_type as TemplateType
    let translatedSlots = cachedRow.translated_slots as unknown as TranslatedSlot[] | null
    if (!translatedSlots?.length) {
      translatedSlots = await translateImageSlots(
        classification.slots,
        targetLanguage,
        countryCode
      )
    }

    const entry = await renderAndUpload(
      translationId,
      imageHash,
      templateType,
      translatedSlots,
      targetLanguage,
      classification,
      src
    )
    return { ...entry, cached: false }
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

  return renderAndUpload(
    translationId,
    imageHash,
    templateType,
    translatedSlots,
    targetLanguage,
    classification,
    src
  )
}

/**
 * Full image localization pass for one translation:
 * classify each image, render templates for informational text,
 * rewrite src in translated content, and persist outcomes.
 */
export async function processImageTranslation(
  translationId: string,
  requestId?: string,
  forceRefresh = false
): Promise<{ entries: ImageOutcomeEntry[]; needsReview: boolean }> {
  const translation = await DbService.getTranslationById(translationId)
  if (!translation) {
    throw new Error(`Translation ${translationId} not found.`)
  }

  const targetLanguage = translation.language_code
  const countryCode = translation.country_code
  let content = translation.translated_content || ''

  // Prefer original Cloudinary src for hashing when content already has rewritten PNGs
  const images = extractLocalizableImages(content)
  if (images.length === 0) {
    await DbService.updateTranslation(translationId, {
      image_texts: [],
      image_translation_needed: false,
    })
    return { entries: [], needsReview: false }
  }

  if (forceRefresh) {
    try {
      await DbService.clearImageTranslationCacheForLocale(targetLanguage)
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : err, targetLanguage },
        'Failed to clear image cache before force refresh'
      )
    }
  }

  const entries: ImageOutcomeEntry[] = []
  for (const { src, originalSrc } of images) {
    const entry = await processSingleImage(
      originalSrc,
      translationId,
      targetLanguage,
      countryCode,
      forceRefresh
    )
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
