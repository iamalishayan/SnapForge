export interface QAWarning {
  message: string
  severity: 'minor' | 'moderate'
}

export interface QAResult {
  passed: boolean
  errors: string[]
  warnings: QAWarning[]
}

export interface TranslationResponse {
  translated_title: string
  translated_content: string
  translated_meta_title: string
  translated_meta_description: string
  translated_faq: Array<{ question: string; answer: string }>
  model_used: string
  input_tokens: number
  output_tokens: number
}

export interface AlertPayload {
  subject: string
  body: string
  metadata?: Record<string, any>
}

