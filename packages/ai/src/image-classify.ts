import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { withTimeout } from '@snapforge/shared'
import { TEMPLATE_TYPES, TEMPLATE_MANIFEST, type TemplateType } from './image-templates/manifest'

export interface ImageSlotValue {
  name: string
  value: string
}

export interface ImageClassification {
  has_informational_text: boolean
  is_logo_or_branding: boolean
  extracted_text: string
  slots: ImageSlotValue[]
  template_type: TemplateType | 'none'
  confidence: number
}

export interface TranslatedSlot {
  name: string
  original: string
  translated: string
}

export type ImageOutcomeStatus =
  | 'kept'
  | 'skipped_logo'
  | 'rendered'
  | 'needs_review'
  | 'failed'

/** Per-image result persisted to translations.image_texts. */
export interface ImageOutcomeEntry {
  src: string
  status: ImageOutcomeStatus
  template_type?: string
  confidence?: number
  extracted_text?: string
  slots?: TranslatedSlot[]
  rendered_src?: string
  error?: string
  cached?: boolean
}

/** Minimum classifier confidence required before auto-rendering a template. */
export const MIN_RENDER_CONFIDENCE = 0.7

const VISION_MODEL = 'gemini-3.6-flash'

function getModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error('Google Generative AI key is missing in environment.')
  }
  return new GoogleGenerativeAI(apiKey).getGenerativeModel(
    { model: VISION_MODEL },
    { apiVersion: 'v1beta' }
  )
}

function slotGuide(): string {
  return TEMPLATE_TYPES.map((type) => {
    const slots = TEMPLATE_MANIFEST[type].slots.join(', ')
    return `- "${type}": slots [${slots}]`
  }).join('\n')
}

/**
 * Classify an image: informational text vs branding, extract slot values,
 * and pick the best-matching SVG template type.
 */
export async function classifyImage(
  imageBase64: string,
  mimeType: string
): Promise<ImageClassification> {
  const model = getModel()

  const prompt = `You are an image triage system for a multilingual publishing pipeline.
Analyze the image and answer strictly as JSON.

Definitions:
- "informational text" = headlines, captions, stats, labels, step descriptions, deadlines — content a reader needs translated.
- "logo or branding" = logos, wordmarks, watermarks, brand names as identity marks. These must NEVER be translated.
- A photo with no meaningful text has has_informational_text=false.

If the image has informational text, choose the ONE template type that best fits its content and fill its slots with the EXACT text extracted from the image (source language, do not translate):
${slotGuide()}

If the content does not cleanly fit any template (charts with data points, screenshots, dense flyers, maps), set template_type to "none".
Set confidence (0-1) for your overall classification and extraction quality.`

  const result = await withTimeout(
    model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            has_informational_text: { type: SchemaType.BOOLEAN },
            is_logo_or_branding: { type: SchemaType.BOOLEAN },
            extracted_text: { type: SchemaType.STRING },
            template_type: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: [...TEMPLATE_TYPES, 'none'],
            },
            confidence: { type: SchemaType.NUMBER },
            slots: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  value: { type: SchemaType.STRING },
                },
                required: ['name', 'value'],
              },
            },
          },
          required: [
            'has_informational_text',
            'is_logo_or_branding',
            'extracted_text',
            'template_type',
            'confidence',
            'slots',
          ],
        },
      },
    }),
    30_000,
    'Gemini image classification timeout after 30s'
  )

  const parsed = JSON.parse(result.response.text()) as ImageClassification
  return {
    has_informational_text: Boolean(parsed.has_informational_text),
    is_logo_or_branding: Boolean(parsed.is_logo_or_branding),
    extracted_text: parsed.extracted_text || '',
    slots: Array.isArray(parsed.slots) ? parsed.slots : [],
    template_type: (TEMPLATE_TYPES as readonly string[]).includes(parsed.template_type)
      ? (parsed.template_type as TemplateType)
      : 'none',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  }
}

/**
 * Translate extracted slot values to the target language (deterministic, JSON).
 */
export async function translateImageSlots(
  slots: ImageSlotValue[],
  targetLanguage: string,
  countryCode: string
): Promise<TranslatedSlot[]> {
  if (slots.length === 0) {
    return []
  }

  const model = getModel()

  const prompt = `Translate the following short image-text segments to ${targetLanguage} (${countryCode} market).
Keep translations concise so they fit in the same visual space. Preserve numbers, currency symbols, dates and proper nouns.
Segments (JSON): ${JSON.stringify(slots)}
Return JSON array of { "name": string, "translated": string } in the same order.`

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              translated: { type: SchemaType.STRING },
            },
            required: ['name', 'translated'],
          },
        },
      },
    }),
    20_000,
    'Gemini slot translation timeout after 20s'
  )

  const parsed = JSON.parse(result.response.text()) as Array<{
    name: string
    translated: string
  }>
  const byName = new Map(parsed.map((item) => [item.name, item.translated]))

  return slots.map((slot) => ({
    name: slot.name,
    original: slot.value,
    translated: byName.get(slot.name) || slot.value,
  }))
}
