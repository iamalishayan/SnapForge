import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../utils/validate'
import { SiteCreateSchema } from '../../../../utils/schemas'
import { handleRouteError } from '../../../../utils/error'
import { logger } from '@snapforge/shared'

// GET /api/sites — list all site configs (including inactive) for admin
export async function GET() {
  try {
    const sites = await DbService.getSiteConfigs({ activeOnly: false })
    return NextResponse.json({ success: true, data: sites })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/sites')
  }
}

// POST /api/sites — create a new site config and auto-generate SEO keywords for all templates
// Body: { domain, language_code, country_code, theme_name?, adsense_publisher_id?, adsense_slot_id?, indexnow_key?, sitemap_url? }
export const POST = withValidation(SiteCreateSchema, async (request, data) => {
  try {
    const { domain, language_code, country_code } = data

    if (!domain || !language_code || !country_code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: domain, language_code, country_code.' },
        { status: 400 }
      )
    }

    // Robust ISO codes validation
    const iso6391 = require('iso-639-1')
    const iso31661 = require('iso-3166-1')

    if (!iso6391.validate(language_code.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid language_code. '${language_code}' is not a recognized ISO-639-1 language code.` },
        { status: 400 }
      )
    }

    if (!iso31661.whereAlpha2(country_code.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid country_code. '${country_code}' is not a recognized ISO-3166-1 alpha-2 country code.` },
        { status: 400 }
      )
    }

    // 1. Create the site config
    const siteConfig = await DbService.createSiteConfig({
      domain,
      language_code,
      country_code,
      theme_name: data.theme_name as string || 'theme_a',
      adsense_publisher_id: data.adsense_publisher_id as string ?? null,
      adsense_slot_id: data.adsense_slot_id as string ?? null,
      monetization_type: data.monetization_type || 'adsense',
      indexnow_key: data.indexnow_key as string ?? null,
      sitemap_url: data.sitemap_url as string ?? null,
      active: data.active ?? true,
    })

    return NextResponse.json({
      success: true,
      data: siteConfig
    }, { status: 201 })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/sites')
  }
})
