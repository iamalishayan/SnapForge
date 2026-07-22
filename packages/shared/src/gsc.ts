import { google } from 'googleapis'

export interface GSCPerformanceMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/**
 * Authenticates with Google APIs and retrieves performance metrics for the specified site URL.
 */
export async function getGSCPerformance(
  siteUrl: string,
  daysAgo = 7
): Promise<GSCPerformanceMetrics> {
  const gscCredsJson = process.env.GOOGLE_GSC_CREDENTIALS
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  let authClient

  if (gscCredsJson) {
    // 1. Load from credentials JSON string directly
    const parsedCreds = JSON.parse(gscCredsJson)
    authClient = new google.auth.JWT(
      parsedCreds.client_email,
      undefined,
      parsedCreds.private_key,
      ['https://www.googleapis.com/auth/webmasters.readonly']
    )
  } else if (credentialsPath) {
    // 2. Fallback to service account key file path
    authClient = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    })
  } else {
    throw new Error('Google GSC API credentials are missing (provide GOOGLE_GSC_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS).')
  }

  const webmasters = google.webmasters({
    version: 'v3',
    auth: authClient
  })

  const endDate = new Date()
  // Search Console data usually has a 2-day delay
  endDate.setDate(endDate.getDate() - 2)
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - daysAgo)

  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  try {
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['date'],
        rowLimit: 1
      }
    })

    const rows = response.data.rows || []
    if (rows.length === 0) {
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    }

    // Accumulate total values
    let totalClicks = 0
    let totalImpressions = 0
    let totalPosition = 0

    for (const row of rows) {
      totalClicks += row.clicks || 0
      totalImpressions += row.impressions || 0
      totalPosition += row.position || 0
    }

    const avgPosition = totalPosition / rows.length
    const calculatedCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0

    return {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: calculatedCtr,
      position: avgPosition
    }
  } catch (error: any) {
    console.error(`[GSC] Failed to fetch metrics for ${siteUrl}:`, error.message)
    throw error;
  }
}


