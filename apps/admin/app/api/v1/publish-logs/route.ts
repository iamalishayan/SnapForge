import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { handleRouteError } from '../../../../utils/error'

export const dynamic = 'force-dynamic'

// GET /api/v1/publish-logs — Fetch publish audit logs
// Query params: ?limit=20, ?cursor=uuid, ?siteId=uuid
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50
    const cursor = searchParams.get('cursor') || undefined
    const siteId = searchParams.get('siteId') || undefined

    const logs = await DbService.getPublishLogs({ limit, cursor, siteId })
    const nextCursor = logs.length > 0 ? logs[logs.length - 1].created_at : null

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        nextCursor
      }
    })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/v1/publish-logs')
  }
}
