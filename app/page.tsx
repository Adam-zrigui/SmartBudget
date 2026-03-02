import type { Metadata } from 'next'
import BudgetTracker from '@/components/BudgetTracker'
import PageAnimationWrapper from '@/components/PageAnimationWrapper'

// ISR: Revalidate every hour
export const revalidate = 3600

// SEO Metadata
export const metadata: Metadata = {
  title: 'Dashboard - SmartBudget',
  description: 'Track your finances, view spending trends, and get AI-powered insights on your money management.',
  openGraph: {
    title: 'Dashboard - SmartBudget',
    description: 'Track your finances and get smart financial insights',
    type: 'website',
  },
}

export default function Home() {
  return (
    <PageAnimationWrapper>
      <BudgetTracker />
    </PageAnimationWrapper>
  )
}
