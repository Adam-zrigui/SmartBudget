import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    const response = NextResponse.json({ success: true });
    
    // Set token in httpOnly cookie (secure in production)
    response.cookies.set('_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
  } catch (err) {
    console.error('Error setting auth token:', err);
    return NextResponse.json({ error: 'Failed to set token' }, { status: 500 });
  }
}
