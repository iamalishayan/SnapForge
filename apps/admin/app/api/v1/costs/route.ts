import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { handleRouteError } from '../../../../utils/error'

export const dynamic = 'force-dynamic'

// GET /api/v1/costs — Fetch cost analytics
// Query params: ?days=30
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 30

    const analytics = await DbService.getCostAnalytics(days)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/v1/costs')
  }
}
