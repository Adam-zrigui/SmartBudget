'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // enforce sensible defaults but allow overrides via props
  return (
    <NextThemesProvider {...props} defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
