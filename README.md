# 💰 SmartBudget

AI-powered personal finance management platform. Track expenses, manage income, plan savings goals, and get personalized financial recommendations powered by Cohere AI.

## ✨ Features

- **Dashboard**: Real-time overview of income, expenses, and savings metrics
- **Transaction Management**: Add, categorize, and track financial transactions
- **AI Financial Advisor**: Chat with an intelligent assistant for personalized financial advice (powered by Cohere)
- **Budget Planning**: Create and monitor budgets across spending categories
- **Tax Calculation**: Built-in German tax calculations (VAT, church tax, etc.)
- **Authentication**: Secure user sign-up/login with NextAuth (Google OAuth)
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS and Radix UI

## 🛠 Tech Stack

### Frontend
- **Next.js 16+** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Unstyled, accessible UI primitives
- **DaisyUI** - Tailwind component library

### Backend
- **Next.js API Routes** - Serverless backend
- **NextAuth.js** - Authentication & session management
- **Prisma ORM** - Database abstraction layer

### Database
- **Neon PostgreSQL** - Cloud-hosted managed PostgreSQL

### AI
- **Cohere API** - Generative AI for financial advice

### DevOps
- **Docker** - Container orchestration (production deployments)
- **Kubernetes (GKE)** - Cloud orchestration
- **GitHub Actions** - CI/CD pipeline

## 📋 Prerequisites

- **Node.js 20+** and **pnpm** (or npm/yarn)
- **PostgreSQL database** (Neon account for cloud DB)
- **Google OAuth credentials** (for authentication)
- **Cohere API key** (for AI features)
- **Docker** (for containerization)
- **kubectl** & **gcloud CLI** (for K8s deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd smartbudget
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```dotenv
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Cohere AI
COHERE_API_KEY="your-cohere-api-key"

# Optional: HuggingFace fallback
HF_API_KEY="your-hf-token"
```

### 3. Set Up Database

```bash
# Run Prisma migrations
pnpm prisma migrate dev

# (Optional) Seed sample data
pnpm prisma db seed
```

### 4. Run Local Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── ai/assistant/        # AI assistant endpoint
│   │   ├── auth/                # NextAuth routes
│   │   └── transactions/        # Transaction CRUD
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── Advisor.tsx              # Chat UI for AI assistant
│   ├── Dashboard.tsx            # Main dashboard
│   ├── BudgetTracker.tsx        # Budget management
│   ├── Transactions.tsx         # Transaction list
│   ├── ui/                      # Radix UI primitives
│   └── ...                      # Other components
├── lib/                          # Utilities & config
│   ├── auth.ts                  # NextAuth configuration
│   ├── prisma.ts                # Prisma client
│   └── utils.ts                 # Helper functions
├── prisma/                       # Database schema
│   ├── schema.prisma            # Prisma schema
│   └── migrations/              # Database migrations
├── public/                       # Static assets
├── k8s/                          # Kubernetes manifests
│   ├── deployment.yaml          # K8s Deployment
│   ├── service.yaml             # K8s Service
│   ├── configmap.yaml           # Config Map
│   ├── secret.yaml              # Secrets template
│   └── ingress.yaml             # Ingress for routing
├── .github/workflows/            # GitHub Actions
│   └── deploy-gke.yml           # CI/CD pipeline
├── Dockerfile                    # Docker image
├── docker-compose.yml            # Local dev compose
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.mjs              # Next.js config
└── tailwind.config.ts           # Tailwind config
```

## 🤖 AI Assistant

The **Advisor** component provides real-time financial guidance:

- **Multi-provider support**: Cohere (primary), HuggingFace (fallback)
- **Context-aware**: Uses your transaction history for personalized advice
- **Goal planning**: Suggests step-by-step plans to reach financial milestones
- **Real-time updates**: Chat messages auto-scroll and display AI responses

### Using the Assistant

1. Click the **floating chat button** in the bottom-right corner
2. Type a financial question (e.g., "How can I save €5k in 6 months?")
3. Get instant AI-generated advice

## 🐳 Docker & Local Development

### Build Docker Image

```bash
docker build -t smartbudget:latest .
```

### Run with Docker Compose

```bash
docker-compose up
```

This starts:
- Next.js app on `http://localhost:3000`
- (Optional) PostgreSQL database on `localhost:5432`

See [DOCKER_K8S_README.md](./DOCKER_K8S_README.md) for detailed Docker & Kubernetes instructions.

## ☸️ Kubernetes Deployment

### Prerequisites

- GKE cluster running
- `kubectl` configured
- `gcloud` CLI authenticated

### Deploy to GKE

```bash
# 1. Update k8s manifests with your values
# Edit k8s/secret.yaml, k8s/configmap.yaml, k8s/ingress.yaml

# 2. Apply manifests
kubectl apply -f k8s/

# 3. Verify deployment
kubectl get pods
kubectl get svc smartbudget-service
```

### Enable Auto-Deploy with GitHub Actions

1. Add GitHub secrets (Settings → Secrets and variables → Actions):
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (service account JSON)
   - `NEXTAUTH_SECRET`
   - `DATABASE_URL`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `COHERE_API_KEY`

2. Push to `main` or `develop` branch — GitHub Actions will automatically build and deploy to GKE.

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `NEXTAUTH_URL` | ✅ | App URL (e.g., `http://localhost:3000` or `https://app.example.com`) |
| `NEXTAUTH_SECRET` | ✅ | Secure random string for session encryption |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth client ID from Google Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth client secret |
| `COHERE_API_KEY` | ✅ | Cohere API key for AI features |
| `HF_API_KEY` | ❌ | HuggingFace API key (fallback AI provider) |
| `NODE_ENV` | ❌ | `development` or `production` |

## 📚 Database Schema

Key tables:
- **User**: User accounts and authentication
- **Transaction**: Income/expense transactions with metadata
- **Budget**: Budget categories and limits
- **SalaryPlan**: Salary tracking and goals

Run `pnpm prisma studio` to explore the database visually.

## 🧪 Testing

```bash
# Run dev server with full logging
pnpm dev

# Check for TypeScript errors
pnpm tsc --noEmit

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🚨 Troubleshooting

### Chat not responding
- Ensure `COHERE_API_KEY` is set and valid
- Check server logs: `pnpm dev` output or `kubectl logs deployment/smartbudget`

### Database connection error
- Verify `DATABASE_URL` is correct and accessible
- For Neon: ensure IP allowlist includes your current IP

### OAuth sign-in fails
- Confirm `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` match your Google Console project
- Add redirect URIs in Google Console:
  - Local: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://your-domain.com/api/auth/callback/google`

### K8s pod crashes
- Check logs: `kubectl logs <pod-name>`
- Verify secrets: `kubectl get secrets app-secrets -o yaml`
- Check resource limits: `kubectl describe pod <pod-name>`

## 📖 Documentation

- [Docker & Kubernetes Setup](./DOCKER_K8S_README.md) - Detailed deployment guide
- [Prisma Schema](./prisma/schema.prisma) - Database structure
- [Next.js Documentation](https://nextjs.org/docs)
- [Cohere API Docs](https://docs.cohere.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📝 License

MIT License — see [LICENSE](./LICENSE) file for details.

## 👤 Author

Created with ❤️ for smarter financial management.

---

**Questions?** Open an issue or refer to [DOCKER_K8S_README.md](./DOCKER_K8S_README.md) for deployment help.
