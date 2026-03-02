const { execSync } = require('child_process');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL detected — running `prisma generate`');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (err) {
    console.error('prisma generate failed:', err);
    process.exit(1);
  }
} else {
  console.log('DATABASE_URL not set — skipping `prisma generate` (safe for local dev)');
}
