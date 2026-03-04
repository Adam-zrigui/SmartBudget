import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - SmartBudget',
  description: 'Sign in or create your account to start managing your finances with SmartBudget.',
  openGraph: {
    title: 'Authentication - SmartBudget',
    description: 'Secure authentication for SmartBudget',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
