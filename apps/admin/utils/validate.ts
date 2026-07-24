import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

/**
 * Higher-Order Function that wraps a Next.js route handler to automatically
 * parse and validate the JSON payload against a Zod schema.
 * 
 * If validation fails, it immediately returns a 422 Unprocessable Entity response.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: Request, data: T, context: any) => Promise<NextResponse> | NextResponse
) {
  return async (request: Request, context: any) => {
    try {
      const body = await request.json()
      const parsed = schema.safeParse(body)
      
      if (!parsed.success) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten()
        }, { status: 422 })
      }
      
      // Pass the strongly-typed parsed data to the handler
      return await handler(request, parsed.data, context)
    } catch (e) {
      if (e instanceof SyntaxError) {
        return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
      }
      console.error('[Validation HOF Error]', e)
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
