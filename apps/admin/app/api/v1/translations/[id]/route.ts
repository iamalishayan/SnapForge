import { handleRouteError } from '../../../../../utils/error'
import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

// GET /api/translations/:id — Fetch a single translation by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing translation ID.' }, { status: 400 })
    }

    const translation = await DbService.getTranslationById(id)
    
    if (!translation) {
      return NextResponse.json({ success: false, error: 'Translation not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: translation })
  } catch (error: any) {
    return handleRouteError(error, '[id]/route.ts')
  }
}
