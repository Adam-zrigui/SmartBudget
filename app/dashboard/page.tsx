import type { Metadata } from 'next'
import SmartBudgetApp from '@/components/SmartBudgetApp'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your finances, view spending trends, and get AI-powered insights on your money management.',
  openGraph: {
    title: 'Dashboard',
    description: 'Track your finances and get smart financial insights',
    type: 'website',
  },
}

export default function DashboardPage() {
  return <SmartBudgetApp />
}
