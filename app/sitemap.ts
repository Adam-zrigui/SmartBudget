import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartbudget.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    '',
    '/transactions',
    '/analytics',
    '/budget',
    '/goals',
    '/recurring',
    '/investments',
    '/currency',
    '/tax',
    '/advisor',
    '/profile',
    '/new',
    '/legal/privacy',
    '/legal/terms',
    '/legal/data-processing',
    '/auth/signin',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
