import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile - SmartBudget',
  description: 'Manage your profile settings, preferences, and account information securely.',
  openGraph: {
    title: 'Profile - SmartBudget',
    description: 'Manage your SmartBudget profile and account settings',
    type: 'website',
  },
  keywords: ['profile', 'account', 'settings', 'preferences'],
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
