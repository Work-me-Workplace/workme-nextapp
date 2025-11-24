import { NextResponse } from 'next/server'
import { parseNTKBlob } from '@/lib/ntk/ntkParser'
import { verifyAuth } from '@/lib/server/verifyAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ntk/parse
 * Parse raw text into structured NTK fields
 * 
 * Body: {
 *   text: string (raw communication text)
 * }
 * 
 * Returns: ParsedNTKInput
 */
export async function POST(req: Request) {
  try {
    // Verify authentication (optional for MVP, but good practice)
    try {
      await verifyAuth(req);
    } catch (authError) {
      // For MVP, we can make auth optional, but log it
      console.warn('[NTK Parse] Unauthenticated request');
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text' },
        { status: 400 },
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 },
      );
    }

    console.log('[API POST /api/ntk/parse]', {
      textLength: text.length,
    });

    const parsed = await parseNTKBlob(text);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('❌ POST /api/ntk/parse error:', err);

    return NextResponse.json(
      {
        error: err.message || 'Parser failed',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}

