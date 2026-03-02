'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './theme-provider'
import { usePrefetch } from '@/hooks/use-prefetch'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Warm critical API data once for the whole app
  usePrefetch()

  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  )
}
