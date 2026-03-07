// Server-side Firebase Admin SDK helpers (lazy initialized).
import * as admin from 'firebase-admin';

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();

  // Support keys wrapped in quotes from env providers.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Support escaped newline format from .env files.
  key = key.replace(/\\n/g, '\n');
  return key;
}

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (process.env.NODE_ENV === 'production') {
    const missing = [
      !projectId ? 'FIREBASE_PROJECT_ID' : '',
      !clientEmail ? 'FIREBASE_CLIENT_EMAIL' : '',
      !privateKey ? 'FIREBASE_PRIVATE_KEY' : '',
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new Error(
        `Missing Firebase Admin environment variables: ${missing.join(', ')}`
      );
    }
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const { projectId, clientEmail, privateKey } = getFirebaseConfig();

  if (projectId && clientEmail && privateKey) {
    try {
      return admin.initializeApp({
        projectId,
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      // Local fallback when env key is malformed.
      return admin.initializeApp({
        projectId: projectId || process.env.GCLOUD_PROJECT || 'local-dev',
      });
    }
  }

  // Development fallback: allow app initialization without credentials.
  // This avoids hard crashes for routes that don't need token verification.
  return admin.initializeApp({
    projectId: projectId || process.env.GCLOUD_PROJECT || 'local-dev',
  });
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}
