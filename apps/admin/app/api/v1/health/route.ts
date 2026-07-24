import { NextResponse } from 'next/server'
import { connection } from '@snapforge/queue'
import { DbService } from '@snapforge/db'

async function testRedis() {
  try {
    const ping = await connection.ping()
    return ping === 'PONG'
  } catch (e) {
    return false
  }
}

async function testDb() {
  try {
    // A lightweight query to verify DB connection
    await DbService.getSiteConfigs()
    return true
  } catch (e) {
    return false
  }
}

// GET /api/health — System health check for monitoring tools
export async function GET() {
  const [redisOk, dbOk] = await Promise.all([testRedis(), testDb()])
  const status = redisOk && dbOk ? 'healthy' : 'degraded'
  
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      redis: redisOk,
      database: dbOk
    }
  }, { status: status === 'healthy' ? 200 : 503 })
}
