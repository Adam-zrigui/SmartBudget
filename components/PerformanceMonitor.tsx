'use client';

/**
 * Performance Monitoring Component
 * 
 * Tracks Core Web Vitals and sends them to analytics
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTFB (Time to First Byte): < 600ms
 * - INP (Interaction to Next Paint): < 200ms
 */

import { useEffect } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB, getINP } from 'web-vitals';

interface MetricData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // LCP (Largest Contentful Paint) - Target: < 2.5s
    getLCP((metric) => {
      const data = {
        name: 'LCP',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      logMetric(data);
      sendToAnalytics(data);
    });

    // FID (First Input Delay) - Target: < 100ms
    getFID((metric) => {
      const data = {
        name: 'FID',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      logMetric(data);
      sendToAnalytics(data);
    });

    // CLS (Cumulative Layout Shift) - Target: < 0.1
    getCLS((metric) => {
      const data = {
        name: 'CLS',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      logMetric(data);
      sendToAnalytics(data);
    });

    // FCP (First Contentful Paint) - Target: < 1.8s
    getFCP((metric) => {
      const data = {
        name: 'FCP',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      logMetric(data);
      sendToAnalytics(data);
    });

    // TTFB (Time to First Byte) - Target: < 600ms
    getTTFB((metric) => {
      const data = {
        name: 'TTFB',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      logMetric(data);
      sendToAnalytics(data);
    });

    // INP (Interaction to Next Paint) - Target: < 200ms
    getINP((metric) => {
      const data = {
        name: 'INP',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      };
      logMetric(data);
      sendToAnalytics(data);
    });
  }, []);

  return null; // This component doesn't render anything, just monitors
}

function logMetric(metric: MetricData) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${metric.name}] Value: ${metric.value.toFixed(2)}ms, Rating: ${metric.rating}`);
  }
}

async function sendToAnalytics(metric: MetricData) {
  // Send to your analytics service
  try {
    // Example: Send to Vercel Analytics
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Example: Send to custom endpoint
    navigator.sendBeacon('/api/metrics', JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }));
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
