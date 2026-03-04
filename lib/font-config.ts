/**
 * Font Optimization Configuration
 * 
 * Implements smart font loading strategies to minimize CLS (Cumulative Layout Shift)
 * and improve Core Web Vitals
 * 
 * Strategies:
 * 1. font-display: swap - Show fallback font immediately, swap when custom font loads
 * 2. Preload critical fonts - Geist font is preloaded in layout.tsx
 * 3. Subset fonts - Only include needed characters
 * 4. Lazy load non-critical fonts
 */

import { Geist, Geist_Mono } from 'next/font/google';

// Primary Font - Loads from Google Fonts with subsetting
export const primaryFont = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap', // Shows system font while loading, prevents invisible text
  weight: ['400', '500', '600', '700'], // Only load needed weights
  preload: true,
});

// Monospace Font - For code and technical content
export const monoFont = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  weight: ['400', '500'], // Only needed weights
  preload: true,
});

/**
 * Tailwind CSS Integration
 * 
 * In tailwind.config.ts, add:
 * ```javascript
 * extend: {
 *   fontFamily: {
 *     sans: ['var(--font-geist)'],
 *     mono: ['var(--font-geist-mono)'],
 *   }
 * }
 * ```
 */

/**
 * Performance Metrics Impact
 * 
 * font-display: swap
 * - LCP improvement: ~200-300ms
 * - CLS prevention: Prevents layout shift when font loads
 * - Trade-off: Brief flash of unstyled text (FOUT)
 * 
 * Subsetting
 * - Font file size reduction: ~40-50% smaller
 * - Download time: 300-500ms faster
 * - Selector: Only 'latin' characters included
 * 
 * Weight Limiting
 * - Font variations: Load only 400, 500, 600, 700
 * - Not loading: 300, 800, 900 unnecessarily
 * - File saving: ~25% per weight removed
 */

export const fontConfig = {
  primary: {
    name: 'Geist',
    variable: '--font-geist',
    display: 'swap',
    weights: [400, 500, 600, 700],
    subsets: ['latin'],
  },
  mono: {
    name: 'Geist Mono',
    variable: '--font-geist-mono',
    display: 'swap',
    weights: [400, 500],
    subsets: ['latin'],
  },
};

/**
 * Usage in React Components:
 * 
 * Apply font variables in layout.tsx:
 * ```tsx
 * <html className={`${primaryFont.variable} ${monoFont.variable}`}>
 * ```
 * 
 * Then in CSS:
 * ```css
 * body {
 *   font-family: var(--font-geist);
 * }
 * code {
 *   font-family: var(--font-geist-mono);
 * }
 * ```
 */
