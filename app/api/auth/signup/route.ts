import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    console.error('server signup error', err);
    // Firebase errors already have a message property
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
}
