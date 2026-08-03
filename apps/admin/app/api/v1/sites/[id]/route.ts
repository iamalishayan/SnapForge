import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { SiteUpdateSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'

// GET /api/sites/[id] — fetch a single site config
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const site = await DbService.getSiteConfigById(params.id)
    return NextResponse.json({ success: true, data: site })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Site not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'GET /api/sites/[id]')
  }
}

// PATCH /api/sites/[id] — update an existing site config
// Allowed fields: domain, language_code, country_code, theme_name, adsense_publisher_id, adsense_slot_id, indexnow_key, sitemap_url, active
export const PATCH = withValidation(SiteUpdateSchema, async (request, data, context: { params: { id: string } }) => {
  try {
    const updatedSite = await DbService.updateSiteConfig(context.params.id, data as any)
    return NextResponse.json({ success: true, data: updatedSite })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Site not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'PATCH /api/sites/[id]')
  }
})
