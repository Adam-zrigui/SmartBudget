import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - SmartBudget',
  description: 'Deep-dive analytics and spending insights. Visualize trends, category breakdown, and financial patterns with interactive charts.',
  openGraph: {
    title: 'Analytics - SmartBudget',
    description: 'Advanced analytics and spending insights powered by AI',
    type: 'website',
  },
  keywords: ['analytics', 'insights', 'spending patterns', 'financial analysis'],
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
