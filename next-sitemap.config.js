module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://smartbudget.app',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*'],
};
