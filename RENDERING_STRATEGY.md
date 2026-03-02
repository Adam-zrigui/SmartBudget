# SmartBudget Rendering & Caching Strategy

This document outlines the comprehensive rendering optimization strategy implemented across the SmartBudget application.

## Overview

The app uses a hybrid rendering approach to maximize performance, user experience, and data freshness:

- **SSG (Static Site Generation)**: For static content
- **ISR (Incremental Static Regeneration)**: For content with periodic updates
- **CSR (Client-Side Rendering)**: For user-specific, real-time content
- **PPR (Partial Pre-Rendering)**: For mixed static/dynamic content shells

---

## Page Rendering Strategy

### Static Pages (SSG)

These pages are prerendered at build time and served as static HTML:

#### `/` (Home / BudgetTracker)
- **Strategy**: SSG with ISR (revalidate every 1 hour)
- **Reason**: Public landing page with general financial information
- **Cache Time**: 3600 seconds (1 hour)
- **Benefits**: Instant load times, improved SEO, reduced server load
- **File**: `app/page.tsx`

```typescript
export const revalidate = 3600; // ISR: revalidate every hour
```

### Client-Side Rendered Pages (CSR)

These pages require authentication and user-specific data, so they're rendered on the client:

#### `/profile`
- **Strategy**: CSR with dynamic data fetching
- **Reason**: User-specific profile data, settings, and security info
- **Loading State**: Uses `app/profile/loading.tsx` skeleton
- **File**: `app/profile/page.tsx`
- **Components**:
  - Profile information display
  - Edit profile functionality
  - Account deletion with two-step confirmation
  - Session management
  - Export options

#### `/profile/change-password`
- **Strategy**: CSR with dynamic data fetching
- **Reason**: Sensitive security operation requiring real-time authentication
- **Loading State**: Uses `app/profile/change-password/loading.tsx` skeleton
- **File**: `app/profile/change-password/page.tsx`

#### `/profile/sessions`
- **Strategy**: CSR with dynamic data fetching
- **Reason**: Real-time session listings and management
- **Loading State**: Uses `app/profile/sessions/loading.tsx` skeleton
- **File**: `app/profile/sessions/page.tsx`

#### `/transactions`
- **Strategy**: CSR with dynamic data fetching
- **Reason**: User-specific transaction history with filtering and search
- **Loading State**: Uses `app/transactions/loading.tsx` skeleton
- **Cache**: API responses cached for 2 minutes (120 seconds)
- **File**: `app/transactions/page.tsx`

#### `/analytics`
- **Strategy**: CSR with dynamic data fetching
- **Reason**: User-specific financial analytics and insights
- **Loading State**: Uses `app/analytics/loading.tsx` skeleton
- **File**: `app/analytics/page.tsx`

#### `/tax`
- **Strategy**: CSR with dynamic calculations
- **Reason**: User-specific tax calculations with real-time form logic
- **Loading State**: Uses `app/tax/loading.tsx` skeleton
- **File**: `app/tax/page.tsx`

#### `/advisor`
- **Strategy**: CSR with real-time AI interactions
- **Reason**: Interactive AI chat requiring real-time responses
- **Loading State**: Uses `app/advisor/loading.tsx` skeleton
- **File**: `app/advisor/page.tsx`

### Authentication Pages (CSR)

#### `/auth/signin` & `/auth/signup`
- **Strategy**: CSR with OAuth integration
- **Reason**: Requires client-side auth library interaction
- **File**: `app/auth/signin/page.tsx`, `app/auth/signup/page.tsx`
- **Note**: OAuth flow requires client-side JavaScript

---

## API Route Caching Strategy

### High-Value Caching (Low-Change Data)

#### `/api/taxes` - Tax Data Reference
- **Revalidate**: 86400 seconds (24 hours)
- **Cache Header**: `public, max-age=86400, immutable`
- **Reason**: Static tax reference data that changes rarely
- **Use Case**: Fetch tax brackets, rates, and calculation data once per day
- **File**: `app/api/taxes/route.ts`

#### `/api/money-tips` - AI Recommendations
- **Revalidate**: 3600 seconds (1 hour)
- **Reason**: Financial recommendations based on spending patterns
- **Frequency**: Updated hourly as spending patterns evolve
- **File**: `app/api/money-tips/route.ts`

### Medium-Value Caching (Dynamic User Data)

#### `/api/user` - User Profile Data
- **Revalidate**: 300 seconds (5 minutes)
- **Cache Header**: `private, max-age=300, must-revalidate`
- **Reason**: User profile changes infrequently
- **Use Case**: Display user name, email, avatar
- **File**: `app/api/user/route.ts`

#### `/api/user/sessions` - Active Sessions
- **Revalidate**: 120 seconds (2 minutes)
- **Cache Header**: `private, max-age=120, must-revalidate`
- **Reason**: Allows quick updates to session list without performance hit
- **File**: `app/api/user/sessions/route.ts`

#### `/api/transactions` - Transaction List
- **Revalidate**: 120 seconds (2 minutes)
- **Cache Header**: `private, max-age=120, must-revalidate`
- **Reason**: Balance between fresh data and reduced database queries
- **Use Case**: Transaction filtering by month/type with caching
- **File**: `app/api/transactions/route.ts`

### No Caching (Real-Time/Mutation Endpoints)

#### `/api/ai/assistant` - AI Chat Endpoint
- **Strategy**: `export const dynamic = 'force-dynamic'`
- **Reason**: Each message generates unique AI responses
- **File**: `app/api/ai/assistant/route.ts`

#### `/api/transactions/[id]` - Transaction CRUD
- **Strategy**: `export const dynamic = 'force-dynamic'`
- **Reason**: Mutation operations (PUT, DELETE) must always be fresh
- **File**: `app/api/transactions/[id]/route.ts`

#### `/api/user/password` - Password Change
- **Strategy**: `export const dynamic = 'force-dynamic'`
- **Reason**: Security-critical mutation operation
- **File**: `app/api/user/password/route.ts`

#### `/api/transactions/export` - Data Export
- **Strategy**: `export const dynamic = 'force-dynamic'`
- **Reason**: Export always generates fresh current data
- **File**: `app/api/transactions/export/route.ts`

#### `/api/auth/signup` - User Registration
- **Strategy**: Dynamic (part of NextAuth)
- **Reason**: Creates new user records
- **File**: `app/api/auth/[...nextauth]/route.ts`

---

## Loading States & Skeletons

All routes with dynamic data use `loading.tsx` files for smooth UX:

- `app/profile/loading.tsx` - Profile skeleton with sidebar and stats
- `app/profile/change-password/loading.tsx` - Password form skeleton
- `app/profile/sessions/loading.tsx` - Session list skeleton
- `app/transactions/loading.tsx` - Transaction list with filters skeleton
- `app/analytics/loading.tsx` - Charts and widgets skeleton
- `app/tax/loading.tsx` - Tax calculator form skeleton
- `app/advisor/loading.tsx` - Chat interface skeleton

**How it works**:
1. User navigates to a route
2. `loading.tsx` displays immediately with animated pulse effects
3. React loads component in background
4. Component replaces skeleton when ready
5. Smooth transition with no white flash

---

## Performance Benefits

### Build-Time Optimization
- **SSG pages**: Pre-rendered at build time → instant delivery
- **ISR**: Automatic revalidation without full rebuilds
- **Reduced initial page load**: Static pages served from CDN

### Runtime Optimization
- **API Caching**: Reduces database queries
- **Browser Caching**: Reduces bandwidth with Cache-Control headers
- **Private caching**: User-specific data cached only in browser/private proxies
- **Public caching**: Static tax data can be cached at CDN/proxy level

### User Experience
- **Loading skeletons**: Perceived faster load times
- **Cache hits**: Instant responses for cached data
- **Real-time data**: Mutations always fetch fresh data
- **Fallback strategy**: If cache expires, revalidation automatically fetches fresh data

---

## Cache Control Headers

### Private Cache (User-Specific Data)
```
Cache-Control: private, max-age=300, must-revalidate
```
- Caches only in user's browser or private proxies
- Revalidates when max-age expires
- Ensures security for personal financial data

### Public Cache (Static Data)
```
Cache-Control: public, max-age=86400, immutable
```
- Can be cached anywhere (CDN, proxies, browsers)
- `immutable` flag: Content never changes
- Used for static tax reference data

---

## Cache Invalidation Strategies

### Automatic Revalidation (ISR)
- If a page/API reaches `revalidate` time, next request triggers revalidation
- Old data served while new data generates in background
- Perfect for content that updates periodically

### On-Demand Revalidation (Future Enhancement)
```typescript
import { revalidatePath, revalidateTag } from 'next/cache';

// When user updates profile
revalidatePath('/profile');
revalidateTag('user-data');
```

---

## Recommended Production Settings

For production deployment, ensure:

1. **CDN in front of edge functions**: CloudFlare, Fastly, or similar
2. **Enable Vercel Caching** (if using Vercel):
   - Automatic HTTP caching
   - Stale-While-Revalidate support
3. **Database connection pooling**: Handle load spikes gracefully
4. **Monitor cache hit rates**: Use analytics to adjust TTLs
5. **Set up alerts**: For cache misses or performance degradation

---

## Monitoring & Adjustment

### Metrics to Track
- **Cache hit rate**: Percentage of requests served from cache
- **First Contentful Paint (FCP)**: Skeleton to content transition time
- **Time to Interactive (TTI)**: When page becomes interactive
- **Database query count**: Should decrease with caching

### When to Adjust TTL
- **Too short (<1 min)**: Excessive database load
- **Too long (>1 hour)**: Stale data frustration
- **Optimal**: Balance based on your data update frequency

### Example Adjustments
```typescript
// If showing stale data for 5 minutes is unacceptable:
export const revalidate = 60; // 1 minute instead of 5

// If database is under heavy load:
export const revalidate = 600; // 10 minutes instead of 5
```

---

## Cache Busting

### Immediate Invalidation (When Needed)
1. **Mutation operations**: Always dynamic
2. **Security-critical**: Password changes, account deletion
3. **User expectations**: Deleting a transaction should remove immediately

### Delayed Invalidation (Acceptable)
1. **Financial insights**: Updates hourly (recommendations)
2. **Analytics**: Updates every 2 minutes (transaction caching)
3. **Profile data**: Updates every 5 minutes

---

## Testing Cache Behavior

### Local Testing
```bash
# Build and test locally
pnpm build
pnpm start

# Check Next.js cache status
# Look for X-Config-Digest headers in responses
```

### Production Testing
1. Check cache headers: `curl -I https://yourdomain.com/profile`
2. Monitor Network tab: Chrome DevTools → Network → Size column
3. Verify cache times: Headers → `cache-control` and `age`

---

## Summary

| Route | Strategy | TTL | Reason |
|-------|----------|-----|--------|
| `/` | SSG + ISR | 1h | Public landing page |
| `/auth/*` | CSR | None | OAuth requires client-side |
| `/profile/*` | CSR | N/A | User-specific, real-time |
| `/transactions` | CSR | 2min | User-specific, semi-dynamic |
| `/analytics` | CSR | N/A | User-specific, real-time |
| `/advisor` | CSR | N/A | Real-time AI chat |
| `/api/user` | Cached | 5min | User profile |
| `/api/transactions` | Cached | 2min | Transaction list |
| `/api/taxes` | Cached | 24h | Static reference data |
| `/api/ai/*` | Dynamic | None | Real-time responses |
| `/api/*/[id]` | Dynamic | None | Mutations |

This strategy ensures:
- ⚡ Fast initial page loads with SSG
- 🔄 Up-to-date data with appropriate ISR/caching
- 🔒 Secure user-specific data with private caching
- 💰 Minimal database load with smart caching
- 😊 Great UX with loading skeletons and instant interactions
