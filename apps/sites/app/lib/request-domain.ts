import { DbService } from '@snapforge/db'

/**
 * Host header candidates matching site_configs.domain
 * (with or without port — local multi-tenant often stores either).
 */
export function hostDomainCandidates(host: string | null | undefined): string[] {
  const raw = (host || '').trim().toLowerCase()
  if (!raw) return []
  const withoutPort = raw.split(':')[0]
  if (raw === withoutPort) return [raw]
  return [withoutPort, raw]
}

/**
 * Resolve the active site config for the incoming Host header.
 */
export async function resolveSiteFromHost(host: string | null | undefined) {
  for (const domain of hostDomainCandidates(host)) {
    const siteConfig = await DbService.getSiteConfigByDomain(domain)
    if (siteConfig) {
      return { domain, siteConfig }
    }
  }
  return null
}

export function resolveRequestDomain(host: string | null | undefined): string {
  return hostDomainCandidates(host)[0] || ''
}
