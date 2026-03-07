import { NextRequest } from 'next/server';

function isFirebaseAdminConfigError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '');
  return (
    msg.includes('Failed to parse private key') ||
    msg.includes('Missing Firebase Admin environment variables') ||
    msg.includes('Failed to initialize Firebase Admin')
  );
}

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

    // Verify token with Firebase Admin SDK (lazy import to avoid dev-time hard crash
    // when local service-account env vars are missing or malformed).
    const { getAdminAuth } = await import('./firebase-admin');
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    return decodedToken.uid; // Firebase user ID
  } catch (err: any) {
    const code = String(err?.code || err?.errorInfo?.code || '');

    // Expired/invalid tokens are expected occasionally on client refresh boundaries.
    if (
      code.includes('auth/id-token-expired') ||
      code.includes('auth/id-token-revoked') ||
      code.includes('auth/argument-error')
    ) {
      return null;
    }

    if (!isFirebaseAdminConfigError(err)) {
      console.error('Firebase token verification failed:', err);
    }
    return null;
  }
}

/**
 * Extract userId from Firebase token. If verification fails, throw 401.
 * TEMPORARY: For testing purposes, return a mock user ID if in development
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string> {
  // Local dev bypass:
  // enabled by default in non-production, unless explicitly disabled.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_AUTH_BYPASS !== 'false'
  ) {
    return 'cjld2cjxh0000qzrmn831i7rn';
  }

  const userId = await verifyFirebaseToken(req);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
