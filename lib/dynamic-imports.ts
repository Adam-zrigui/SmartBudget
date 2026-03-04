/**
 * Dynamic Imports for Code Splitting & Performance
 * 
 * Heavy components are loaded on-demand to reduce initial bundle size
 * This improves initial page load time significantly
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Skeleton/Loading component for dynamic imports
const DynamicLoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 bg-base-200 rounded-lg" />
    <div className="h-64 bg-base-200 rounded-lg" />
  </div>
);

// Dashboard Components - Load Only When Needed
export const DynamicDashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <DynamicLoadingSkeleton />,
  ssr: true,
});

export const DynamicTransactions = dynamic(() => import('@/components/Transactions'), {
  loading: () => <DynamicLoadingSkeleton />,
  ssr: true,
});

export const DynamicAnalytics = dynamic(() => import('@/components/Analytics'), {
  loading: () => <DynamicLoadingSkeleton />,
  ssr: true,
});

export const DynamicTax = dynamic(() => import('@/components/Tax'), {
  loading: () => <DynamicLoadingSkeleton />,
  ssr: true,
});

export const DynamicAdvisor = dynamic(() => import('@/components/Advisor'), {
  loading: () => <DynamicLoadingSkeleton />,
  ssr: false, // Chat interface doesn't need SSR
});

export const DynamicBudgetTracker = dynamic(() => import('@/components/BudgetTracker'), {
  loading: () => <DynamicLoadingSkeleton />,
  ssr: true,
});

// UI Components - Heavy Libraries
export const DynamicChart = dynamic(() => import('recharts').then(mod => ({
  default: (props: any) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={props.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={props.xDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={props.dataKey} fill={props.fill} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
})), {
  loading: () => <div className="h-80 bg-base-200 rounded-lg animate-pulse" />,
  ssr: false,
});

/**
 * Usage example:
 * 
 * // In a page or component:
 * import { DynamicTransactions } from '@/lib/dynamic-imports'
 * 
 * export default function Page() {
 *   return <DynamicTransactions />
 * }
 */

export default {
  DynamicDashboard,
  DynamicTransactions,
  DynamicAnalytics,
  DynamicTax,
  DynamicAdvisor,
  DynamicBudgetTracker,
};
