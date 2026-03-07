# SmartBudget

A modern, AI-powered personal finance management app built with Next.js 16 to help users track spending, plan budgets, and make better financial decisions.

![SmartBudget](https://img.shields.io/badge/SmartBudget-Financial_Planning-blue?style=for-the-badge&logo=next.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase)

## Features

### Transaction Management
- Income and expense tracking
- Fast create/edit/delete transaction flows
- CSV/JSON export options
- Category-based organization

### Planning and Insights
- Budget planning with progress tracking
- Savings goals with contributions
- Recurring booking management
- Investment portfolio tracking
- Currency conversion and base currency support
- Weekly momentum score and savings streak tracking
- Goal autopilot simulator (salary-to-goal timeline)

### Tax Tools
- Tax pages and calculators
- Income-focused tax overview workflows

### AI Advisor
- AI assistant endpoint with provider fallback support (Groq/Cohere/HF)
- Proactive quick actions from dashboard (weekly plan, savings ideas, autopilot optimization)

### Internationalization
- German and English support in UI

### UX
- Mobile-first layouts
- Responsive dashboard and feature pages
- Improved forms and feedback states across core modules

### Security and Auth
- Firebase Authentication (client)
- Firebase Admin token verification (server)
- Protected API routes with user-scoped data

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + DaisyUI

### Backend and Data
- Next.js Route Handlers
- Prisma ORM
- PostgreSQL (Neon-compatible)
- Firebase Auth + Firebase Admin SDK

### Deployment and Observability
- Vercel
- `@vercel/analytics`
- `@vercel/speed-insights`

## Prerequisites

- Node.js 18+
- pnpm 10+ (recommended)
- PostgreSQL database
- Firebase project with Google Auth enabled

## Installation

1. Clone repository
```bash
git clone https://github.com/Adam-zrigui/smartbudget.git
cd smartbudget
```

2. Install dependencies
```bash
pnpm install
```

3. Configure environment (`.env.local`)
```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"

# Site URL (important for SEO + metadata)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"

# Firebase client config
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase Admin SDK (server)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Dev auth bypass (local only)
# In production set false (or omit)
ALLOW_DEV_AUTH_BYPASS="true"

# Optional AI provider keys
GROQ_API_KEY=""
COHERE_API_KEY=""
HF_API_KEY=""
HF_MODEL="facebook/blenderbot-400M-distill"
USE_LOCAL_AI="false"
```

4. Prisma setup
```bash
pnpm prisma generate
pnpm prisma db push
```

5. Run app
```bash
pnpm dev
```

Open `http://localhost:3000`.

## Main Routes

- `/transactions`
- `/budget`
- `/goals`
- `/recurring`
- `/investments`
- `/currency`
- `/tax` and `/taxes`
- `/advisor`
- `/new`
- `/profile`

## Scripts

```bash
pnpm dev              # development server
pnpm build            # prisma generate + next build + sitemap
pnpm start            # production server
pnpm lint             # eslint
pnpm analyze          # analyze build
pnpm bundle:analyze   # bundle report
pnpm perf             # perf benchmark script
pnpm optimize         # build + analysis
```

## Deployment (Vercel)

1. Import repo in Vercel
2. Add all env vars above
3. Set production URLs:
   - `NEXT_PUBLIC_APP_URL=https://your-domain`
   - `SITE_URL=https://your-domain`
4. Redeploy after env updates

## Production Checklist

- Firebase Admin env vars set correctly (`FIREBASE_*`)
- `FIREBASE_PRIVATE_KEY` format preserved with escaped `\n`
- Firebase Auth authorized domains include your deployed domain
- `ALLOW_DEV_AUTH_BYPASS=false` in production
- `pnpm build` passes

## Auth Troubleshooting

If protected APIs return `401 Unauthorized`:

1. Check `/api/auth/verify` after login
2. Verify `_auth_token` cookie is being set
3. Re-check Firebase Admin env vars in Vercel
4. Confirm deployed domain is in Firebase Authorized Domains

## Project Structure

```text
smartbudget/
├── app/                  # app routes + api routes
├── components/           # reusable UI and feature components
├── lib/                  # auth, firebase, prisma, utils
├── prisma/               # schema and prisma config
├── public/               # static assets
└── styles/               # additional styles
```

## Contributing

1. Fork repository
2. Create branch
3. Commit changes
4. Open pull request

## License

MIT. See [LICENSE](LICENSE).

---

SmartBudget - Take control of your money, take control of your future.
