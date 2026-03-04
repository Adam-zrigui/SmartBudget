import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear token cookie
    response.cookies.set('_auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (err) {
    console.error('Error clearing auth token:', err);
    return NextResponse.json({ error: 'Failed to clear token' }, { status: 500 });
  }
}
