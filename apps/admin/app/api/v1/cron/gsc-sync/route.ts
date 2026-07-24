import { handleRouteError } from '../../../../../utils/error'
import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { getGSCPerformance, sendAlert, logger } from '@snapforge/shared'

// GET /api/cron/gsc-sync — Daily cron job syncs Google Search Console performance per site
export async function GET(request: Request) {
  try {
    // 1. Fetch active sites
    const sites = await DbService.getSiteConfigs()
    if (sites.length === 0) {
      return NextResponse.json({ success: true, message: 'No sites to sync.' })
    }

    const results = []

    for (const site of sites) {
      try {
        const siteUrl = `sc-domain:${site.domain}` // GSC domain property format prefix
        const metrics = await getGSCPerformance(siteUrl, 7)

        // 2. Persist metrics to the DB indexing_stats table
        // Schema columns: total_clicks, total_impressions, avg_ctr, avg_position, date
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        await DbService.recordIndexingStats(site.id, {
          date: today,
          total_clicks: metrics.clicks,
          total_impressions: metrics.impressions,
          avg_ctr: metrics.ctr,
          avg_position: metrics.position
        })

        results.push({
          site: site.domain,
          success: true,
          metrics
        })
      } catch (err: any) {
        logger.error({ site: site.domain, err: err.message }, 'Error syncing GSC')
        // Alert developer of credential error or sync failure
        await sendAlert(
          `GSC Sync Failed: ${site.domain}`,
          `Failed to sync GSC metrics for site config ${site.id} on domain ${site.domain}. Reason: ${err.message}`
        )

        results.push({
          site: site.domain,
          success: false,
          error: err.message
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/cron/gsc-sync')
  }
}

