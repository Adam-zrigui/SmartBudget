import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-helper';

/**
 * Verify that the auth token is properly set and valid
 * Used by the signin flow to validate token persistence before redirecting
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await verifyFirebaseToken(req);
    
    if (!userId) {
      return NextResponse.json(
        { authenticated: false, error: 'No valid token found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      userId,
    });
  } catch (err) {
    console.error('Token verification error:', err);
    return NextResponse.json(
      { authenticated: false, error: 'Token verification failed' },
      { status: 401 }
    );
  }
}
