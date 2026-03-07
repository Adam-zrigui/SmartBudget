/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl:
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  generateRobotsTxt: false, // we provide our own
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ['/profile/*', '/auth/*', '/api/*'],
}; 
