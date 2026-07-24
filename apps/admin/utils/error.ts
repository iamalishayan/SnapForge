import { NextResponse } from 'next/server'
import { logger } from '@snapforge/shared'

export class AppError extends Error {
  constructor(
    public clientMessage: string,
    public httpStatus: number = 400,
    public internalDetails?: any
  ) {
    super(clientMessage)
    this.name = 'AppError'
  }
}

export function handleRouteError(error: unknown, context: string) {
  // Always log the full error details securely on the server side
  logger.error({ err: error, context }, 'Route Error')

  // If we intentionally threw this error with a safe client message
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.clientMessage },
      { status: error.httpStatus }
    )
  }

  // Fallback for unexpected, internal errors: NEVER expose the raw message to the client
  return NextResponse.json(
    { success: false, error: 'An internal server error occurred.' },
    { status: 500 }
  )
}
