/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for better error detection
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // Experimental features for performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react'],
  },

  // Compression
  compress: true, // GZIP compression
  
  // Security headers
  poweredByHeader: false, // Remove X-Powered-By header
  productionBrowserSourceMaps: false, // Disable source maps in production

  // Image optimization - critical for Core Web Vitals
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    loader: 'default',
    disableStaticImages: false,
  },

  // Incremental Static Regeneration (ISR) setup
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5,
  },

  // HTTP response caching headers - CRITICAL FOR ISR & SEO
  async headers() {
    return [
      // API endpoints - shorter cache
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=120' },
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
      // Static assets - long cache
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Fonts - very long cache
      {
        source: '/:path*\\.(woff|woff2|ttf|otf|eot)$',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Images - long cache
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Pages - revalidate frequently for ISR
      {
        source: '/((?!_next|api|static|public).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // Global security headers
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';" },
        ],
      },
    ];
  },

  // Redirects for SEO & performance
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        destination: '/:path*',
        permanent: true,
        has: [
          {
            type: 'host',
            value: 'www.smartbudget.app',
          },
        ],
      },
    ];
  },

  // Rewrites for cleaner URLs
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite /sitemap to /sitemap.xml
        {
          source: '/sitemap',
          destination: '/sitemap.xml',
        },
      ],
      afterFiles: [],
    };
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://smartbudget.app',
  },

  // Turbopack configuration for Next.js 16
  turbopack: {
    // Turbopack handles optimization automatically
  },

  // Enable logging
  logging: {
    fetches: {
      full: true,
      hmrRefresh: true,
    },
  },

  // Automatic static optimization
  staticPageGenerationTimeout: 60,

  // Output
  output: 'standalone',
};

export default nextConfig
