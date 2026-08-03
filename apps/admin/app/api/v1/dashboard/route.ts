import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { handleRouteError } from '../../../../utils/error'

export const dynamic = 'force-dynamic'

// GET /api/v1/dashboard — Fetch top level metrics for the dashboard
export async function GET(request: Request) {
  try {
    const stats = await DbService.getDashboardStats()
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/v1/dashboard')
  }
}
