'use client'

import { ThemeProvider } from './theme-provider'
import { AuthProvider } from './AuthContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
