import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Financial Advisor - SmartBudget',
  description: 'Chat with your personal AI financial advisor. Get instant answers about budgeting, spending, and personalized financial recommendations.',
  openGraph: {
    title: 'AI Financial Advisor - SmartBudget',
    description: 'Get smart financial advice from your personal AI advisor',
    type: 'website',
  },
  keywords: ['AI advisor', 'financial advice', 'budgeting tips', 'spending analysis'],
}

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
