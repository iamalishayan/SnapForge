import { DbService } from '@snapforge/db'
import { slugify } from '../../../../utils/slugify'

/** Builds a unique slug for an article within its template. */
export async function resolveArticleSlug(
  title: string,
  templateId: string,
  requestedSlug?: string | null
): Promise<string> {
  const base = slugify(requestedSlug || title)
  let candidate = base
  let suffix = 2

  while (await DbService.getArticleByTemplateAndSlug(templateId, candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
    if (suffix > 100) {
      throw new Error('Unable to generate a unique article slug.')
    }
  }

  return candidate
}
