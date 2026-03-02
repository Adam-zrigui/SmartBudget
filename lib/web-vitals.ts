// lib/web-vitals.ts
// Monitor Core Web Vitals for performance optimization

export function reportWebVitals(metric: any) {
  if (typeof window !== 'undefined') {
    // Send to analytics
    const url = `/api/analytics/vitals`
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, JSON.stringify(metric))
    } else {
      // Fallback for browsers that don't support sendBeacon
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(metric),
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {})
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(0)}ms`)
    }
  }
}

// Performance metric types
interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: string
  delta: number
  entries: any[]
}

export function trackCoreWebVitals() {
  // Track LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
        const lcpValue = lastEntry.renderTime || lastEntry.loadTime || 0
        
        reportWebVitals({
          name: 'LCP',
          value: lcpValue,
          rating: lcpValue < 2500 ? 'good' : 'poor'
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // Ignore errors
    }

    // Track FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingDuration?: number }
          const processingDuration = fidEntry.processingDuration || 0
          reportWebVitals({
            name: 'FID',
            value: processingDuration,
            rating: processingDuration < 100 ? 'good' : 'poor'
          })
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      // Ignore errors
    }

    // Track CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value || 0
            reportWebVitals({
              name: 'CLS',
              value: clsValue,
              rating: clsValue < 0.1 ? 'good' : 'poor'
            })
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      // Ignore errors
    }
  }
}
