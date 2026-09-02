import { DbService } from "@snapforge/db"
import { revalidationQueue } from "@snapforge/queue"
import { pingIndexNow, logger } from "@snapforge/shared"
import { getTranslationPageSlugs, buildPublicPageUrl } from "../app/api/v1/translations/page-path"

/**
 * Shared publish side-effects for a translation:
 *   1. Queue a Vercel ISR revalidation job
 *   2. Ping IndexNow when the site has a key configured
 *   3. Write an immutable publish_log audit row
 *
 * Used by both the manual QA approve route and the Supabase
 * translation-approved webhook so the two paths stay consistent.
 */
export async function runPublishSideEffects(params: {
  translationId: string
  domain: string
  requestId?: string
}): Promise<{ indexNowPinged: boolean; indexNowResponse: any }> {
  const { translationId, domain, requestId } = params

  // Resolve template/article slugs for the public URL + revalidation path
  const { templateSlug, articleSlug } = await getTranslationPageSlugs(translationId)

  // Fetch the site config for its IndexNow key
  const site = await DbService.getSiteConfigByDomain(domain)
  if (!site) {
    throw new Error(`Site config not found for domain: ${domain}`)
  }

  const pageUrl = buildPublicPageUrl(domain, templateSlug, articleSlug)
  const safeDomain = domain.replace(/:/g, "_")

  // 1. Queue revalidation job (deduplicated per domain/slug)
  await (revalidationQueue as any).add(
    "revalidate",
    { domain, templateSlug, articleSlug, requestId },
    {
      jobId: `revalidate___${safeDomain}___${templateSlug}___${articleSlug}`,
      removeOnComplete: true,
      removeOnFail: false,
    }
  )

  // 2. Ping IndexNow if the site has a key configured
  let indexNowResponse: any = null
  let indexNowPinged = false

  if (site.indexnow_key) {
    indexNowResponse = await pingIndexNow(site.domain, site.indexnow_key, [pageUrl])
    indexNowPinged = true
  }

  // 3. Immutable audit trail
  await DbService.logPublishAction({
    translation_id: translationId,
    site_config_id: site.id,
    action: "published",
    indexnow_pinged: indexNowPinged,
    indexnow_response: indexNowResponse as any,
    vercel_revalidation_triggered: true,
    page_url: pageUrl,
  })

  logger.info({ pageUrl }, "Triggered revalidation + IndexNow")

  return { indexNowPinged, indexNowResponse }
}