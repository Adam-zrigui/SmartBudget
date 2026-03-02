import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Transaction - SmartBudget',
  description: 'Create a new financial transaction quickly. Add income or expenses with categories, dates, and notes.',
  openGraph: {
    title: 'New Transaction - SmartBudget',
    description: 'Add a new transaction to track your finances',
    type: 'website',
  },
  keywords: ['new transaction', 'add expense', 'record income'],
}

export default function NewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
