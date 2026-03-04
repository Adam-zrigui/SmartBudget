import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

/**
 * Verify Firebase ID token from request Authorization header or cookies
 * Returns userId if valid, null if invalid/missing
 */
export async function verifyFirebaseToken(req: NextRequest): Promise<string | null> {
  try {
    // Try Authorization header first: "Bearer <idToken>"
    const authHeader = req.headers.get('authorization');
    let token = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      // Try Firebase Auth token from cookie (can be set by client after login)
      token = req.cookies.get('_auth_token')?.value || null;
    }

    if (!token) {
      return null;
    }

    // Verify token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid; // Firebase user ID
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return null;
  }
}

/**
 * Extract userId from Firebase token. If verification fails, throw 401.
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string> {
  const userId = await verifyFirebaseToken(req);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
