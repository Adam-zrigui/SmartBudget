import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tax Planning - SmartBudget',
  description: 'Comprehensive tax planning and calculation tools. Calculate German income tax, optimize your tax strategy, and plan for tax-efficient financial management.',
  openGraph: {
    title: 'Tax Planning - SmartBudget',
    description: 'Tax planning and calculation for German taxpayers',
    type: 'website',
  },
  keywords: ['tax planning', 'tax calculation', 'German taxes', 'tax optimization'],
}

export default function TaxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
