import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { suggestKeywords } from '@snapforge/ai'
import { withValidation } from '../../../../utils/validate'
import { SiteCreateSchema } from '../../../../utils/schemas'
import { handleRouteError } from '../../../../utils/error'
import { logger } from '@snapforge/shared'

// GET /api/sites — list all active site configs
export async function GET() {
  try {
    const sites = await DbService.getSiteConfigs()
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
      theme_name: (data as any).theme_name || 'theme_a',
      adsense_publisher_id: (data as any).adsense_publisher_id || null,
      adsense_slot_id: (data as any).adsense_slot_id || null,
      monetization_type: (data as any).monetization_type || 'adsense',
      indexnow_key: (data as any).indexnow_key || null,
      sitemap_url: (data as any).sitemap_url || null,
      active: true
    })

    // 2. Auto-generate keywords for all existing templates in the new language
    //    This is where keyword-suggester is called — fired automatically when a site is registered
    const templates = await DbService.getTemplates()
    const keywordResults: { template: string; keywords: string[] }[] = []

    for (const template of templates) {
      try {
        const keywords = await suggestKeywords(template.name, template.gemini_prompt || '', language_code, country_code)

        if (keywords.length > 0) {
          await DbService.saveKeywords({
            template_id: template.id,
            language_code,
            country_code,
            primary_keyword: keywords[0],          // Top suggestion = primary
            secondary_keywords: keywords.slice(1), // Rest = secondary
            source: 'gemini-auto'
          })

          keywordResults.push({ template: template.name, keywords })
        }
      } catch (kwErr: any) {
        // Don't fail the whole request if keyword generation fails for one template
        logger.warn({ template: template.name, err: kwErr.message }, 'Keyword gen skipped for template')
      }
    }

    return NextResponse.json({
      success: true,
      data: siteConfig,
      keywords_generated: keywordResults.length,
      keyword_details: keywordResults
    }, { status: 201 })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/sites')
  }
})
