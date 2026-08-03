/** Trim and convert blank strings to SQL NULL equivalents. */
export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Normalize optional SEO columns on article create/update payloads. */
export function normalizeArticleSeoFields<T extends Record<string, unknown>>(data: T): T {
  const result: any = { ...data }

  if ('meta_title' in result) {
    result.meta_title = emptyToNull(result.meta_title as string | null | undefined)
  }
  if ('meta_description' in result) {
    result.meta_description = emptyToNull(result.meta_description as string | null | undefined)
  }
  if ('og_image_url' in result) {
    result.og_image_url = emptyToNull(result.og_image_url as string | null | undefined)
  }

  return result as T
}
