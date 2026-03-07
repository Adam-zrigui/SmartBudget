# SmartBudget

SmartBudget is a personal finance web app built with Next.js 16, TypeScript, Prisma, PostgreSQL, and Firebase Auth.

It supports day-to-day money management with dedicated pages for:
- Transactions (`/transactions`)
- Budget planning (`/budget`)
- Savings goals (`/goals`)
- Recurring bookings (`/recurring`)
- Investment tracking (`/investments`)
- Currency exchange rates (`/currency`)
- Tax tools (`/tax`, `/taxes`)
- AI advisor (`/advisor`)

## Tech Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + DaisyUI
- Prisma + PostgreSQL
- Firebase Auth (client + admin)

## Requirements
- Node.js 18+
- pnpm 10+ (recommended)
- PostgreSQL database
- Firebase project

## Quick Start
1. Install dependencies:
```bash
pnpm install
```

2. Create `.env.local` (or `.env`) and add the variables below.

3. Generate Prisma client and push schema:
```bash
pnpm prisma generate
pnpm prisma db push
```

4. Start development server:
```bash
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

### Database
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

### Public Firebase (client)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin (server)
```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Important: `FIREBASE_PRIVATE_KEY` must be the private key value with escaped newlines (`\n`) in `.env` files.

### Optional
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
SITE_URL=http://localhost:3000
ALLOW_DEV_AUTH_BYPASS=true

# AI provider keys (any one)
GROQ_API_KEY=
COHERE_API_KEY=
HF_API_KEY=
HF_MODEL=facebook/blenderbot-400M-distill
USE_LOCAL_AI=false
```

## Authentication Behavior
- In development (`NODE_ENV != production`), API auth bypass is enabled by default unless `ALLOW_DEV_AUTH_BYPASS=false`.
- In production, valid Firebase Admin credentials are required for token verification.

If you see `Failed to parse private key`, fix `FIREBASE_PRIVATE_KEY` formatting first.

## Scripts
```bash
pnpm dev              # start dev server
pnpm build            # prisma generate + next build + sitemap
pnpm start            # start production server
pnpm lint             # run eslint
pnpm analyze          # bundle analysis build
pnpm bundle:analyze   # generate bundle analysis report
pnpm perf             # run performance benchmark script
pnpm optimize         # build + bundle analysis
```

## Production Checklist
- Set all Firebase Admin env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
- Set all public Firebase env vars.
- Set `DATABASE_URL` to production database.
- Set `NEXT_PUBLIC_APP_URL` and `SITE_URL` to your live domain.
- Set `ALLOW_DEV_AUTH_BYPASS=false`.
- Run `pnpm build` successfully before deploy.

## Deployment
### Vercel
- Import repository
- Add environment variables
- Deploy with default Next.js settings

### Docker
```bash
docker build -t smartbudget .
docker run -p 3000:3000 smartbudget
```

## License
MIT. See [LICENSE](LICENSE).
