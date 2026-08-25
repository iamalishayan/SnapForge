import { createHash } from 'crypto'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * Stable content hash used as the image-translation cache key.
 */
export function hashImageBytes(base64: string): string {
  return createHash('sha256').update(Buffer.from(base64, 'base64')).digest('hex')
}

/**
 * Returns true when the URL is safe to fetch for image analysis.
 */
export function isValidPublicImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    const hostname = parsed.hostname
    const blocked =
      /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/i
    return !blocked.test(hostname)
  } catch {
    return false
  }
}

/**
 * Parse a data: URI into base64 payload and mime type.
 */
function parseDataUri(src: string): { base64: string; mimeType: string } | null {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(src)
  if (!match) {
    return null
  }
  return { mimeType: match[1], base64: match[2] }
}

function guessMimeType(url: string, contentType: string | null): string {
  if (contentType && contentType.startsWith('image/')) {
    return contentType.split(';')[0]
  }
  const lower = url.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

/**
 * Load image bytes as base64 for Gemini vision input.
 */
export async function fetchImageAsBase64(
  src: string
): Promise<{ base64: string; mimeType: string }> {
  // Fix Oracle Cloud IPv6 ETIMEDOUT issue
  require('dns').setDefaultResultOrder('ipv4first')

  const dataUri = parseDataUri(src)
  if (dataUri) {
    return dataUri
  }

  if (!isValidPublicImageUrl(src)) {
    throw new Error(`Blocked or invalid image URL: ${src}`)
  }

  const response = await fetch(src, {
    headers: { Accept: 'image/*' },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}): ${src}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit: ${src}`)
  }

  const mimeType = guessMimeType(src, response.headers.get('content-type'))
  return { base64: buffer.toString('base64'), mimeType }
}
