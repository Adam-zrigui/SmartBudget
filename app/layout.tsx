import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import Providers from '@/components/Providers'

const geist = Geist({ subsets: ["latin"], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-geist-mono' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smartbudget.app'),
  title: {
    default: 'SmartBudget - Intelligent Personal Finance Management',
    template: '%s | SmartBudget'
  },
  description: 'AI-powered personal finance management platform. Track expenses, analyze spending patterns, and get smart financial insights.',
  keywords: ['finance', 'budget', 'expense tracker', 'personal finance', 'AI advisor', 'financial planning'],
  authors: [{ name: 'SmartBudget', url: 'https://smartbudget.app' }],
  creator: 'SmartBudget',
  publisher: 'SmartBudget',
  formatDetection: { email: false, telephone: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smartbudget.app',
    siteName: 'SmartBudget',
    title: 'SmartBudget - Intelligent Personal Finance Management',
    description: 'AI-powered personal finance management platform with smart insights and financial planning.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SmartBudget - Intelligent Finance Management',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartBudget - Intelligent Personal Finance Management',
    description: 'AI-powered personal finance management platform',
    creator: '@smartbudget',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SmartBudget',
  },
  category: 'finance',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SmartBudget" />
        <meta name="msapplication-TileColor" content="#2d2d2d" />
        <link rel="alternate" hrefLang="en" href="https://smartbudget.app" />
        <link rel="alternate" hrefLang="de" href="https://smartbudget.app/de" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.example.com" />
        {/* Prefetch next important routes to improve navigations */}
        <link rel="prefetch" href="/transactions" as="document" />
        <link rel="prefetch" href="/analytics" as="document" />
        <link rel="prefetch" href="/tax" as="document" />
        <link rel="prefetch" href="/advisor" as="document" />
        {/* Preload main social image for rich link previews and faster LCP on social shares */}
        <link rel="preload" href="/og-image.png" as="image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'SmartBudget',
              description: 'Intelligent personal finance management platform with AI insights',
              url: 'https://smartbudget.app',
              applicationCategory: 'FinanceApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1200'
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
