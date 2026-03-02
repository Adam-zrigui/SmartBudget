/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://smart-budget-delta.vercel.app',
  generateRobotsTxt: false, // we provide our own
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ['/profile/*', '/auth/*', '/api/*'],
};