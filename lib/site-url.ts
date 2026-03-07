export function getSiteUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fromSite = process.env.SITE_URL?.trim();
  const fromVercel = process.env.VERCEL_URL?.trim();

  const raw = fromPublic || fromSite || (fromVercel ? `https://${fromVercel}` : '');
  if (!raw) return 'http://localhost:3000';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/\/+$/, '');
  }

  return `https://${raw.replace(/\/+$/, '')}`;
}
