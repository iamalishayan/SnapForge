import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { translationQueue, revalidationQueue } from '@snapforge/queue'
import { handleRouteError } from '../../../../utils/error'

export const dynamic = 'force-dynamic'

// GET /api/v1/monitoring — Fetch GSC monitoring stats and live queue health
// Query params: ?days=30
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 30

    // Fetch DB stats and Queue stats concurrently
    const [dbStats, tqCounts, rqCounts] = await Promise.all([
      DbService.getMonitoringStats(days),
      translationQueue.getJobCounts(),
      revalidationQueue.getJobCounts()
    ])

    return NextResponse.json({
      success: true,
      data: {
        gsc: dbStats,
        queues: {
          translation: tqCounts,
          revalidation: rqCounts
        }
      }
    })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/v1/monitoring')
  }
}
