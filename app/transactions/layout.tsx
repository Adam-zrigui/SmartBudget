import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transactions - SmartBudget',
  description: 'View, manage and categorize all your financial transactions. Track spending patterns with detailed filtering and export options.',
  openGraph: {
    title: 'Transactions - SmartBudget',
    description: 'Manage your financial transactions with AI insights',
    type: 'website',
  },
  keywords: ['transactions', 'expenses', 'income', 'financial tracking'],
}

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
