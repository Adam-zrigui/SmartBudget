import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

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
