# SmartBudget 💰

A modern, AI-powered personal finance management application built with Next.js 16, designed to help you take control of your financial future.

![SmartBudget](https://img.shields.io/badge/SmartBudget-Financial_Planning-blue?style=for-the-badge&logo=next.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase)

## ✨ Features

### 💳 Transaction Management
- **Income & Expense Tracking**: Easily log and categorize all your financial transactions
- **Real-time Updates**: Instant synchronization across all devices
- **Export Options**: Export your data as CSV or JSON for external analysis
- **Smart Categorization**: Intelligent transaction categorization

### 📊 Analytics & Insights
- **Financial Dashboard**: Comprehensive overview of your financial health
- **Trend Analysis**: Visualize spending patterns and income trends
- **Category Breakdown**: Detailed analysis by spending categories
- **Savings Rate Calculator**: Track your savings progress

### 🧾 Tax Management
- **German Tax Calculator**: Built-in 2024 tax calculations for German residents
- **Payroll Tax Analysis**: Detailed breakdown of payroll deductions
- **State-specific Calculations**: Support for different German states
- **Tax Optimization Tips**: AI-powered suggestions for tax efficiency

### 🤖 AI Financial Advisor
- **Personalized Advice**: AI-powered financial recommendations
- **Budget Optimization**: Smart suggestions for budget improvements
- **Investment Insights**: Guidance on investment strategies
- **Risk Assessment**: Financial risk analysis and mitigation strategies

### 🌍 Internationalization
- **Multi-language Support**: German and English language options
- **Localized Content**: Region-specific financial information
- **Currency Support**: Euro-focused with extensible currency system

### 🎨 User Experience
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Dark/Light Mode**: Seamless theme switching
- **Touch-friendly Interface**: 44px minimum touch targets for mobile
- **Smooth Animations**: Polished transitions and interactions

### 🔒 Security & Privacy
- **Firebase Authentication**: Secure Google sign-in integration
- **GDPR Compliant**: Full compliance with European privacy regulations
- **Data Encryption**: Secure data storage and transmission
- **Privacy Controls**: User-controlled data management

## 🚀 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind CSS

### Backend & Database
- **Prisma** - Next-generation ORM for TypeScript & Node.js
- **PostgreSQL** - Robust relational database
- **Firebase Auth** - Authentication and user management

### AI & Integrations
- **OpenAI API** - AI-powered financial advice
- **Firebase** - Authentication and hosting
- **Vercel** - Deployment and hosting platform

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Next Sitemap** - SEO optimization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17 or later
- **npm** or **pnpm** package manager
- **PostgreSQL** database (local or cloud)
- **Firebase** project with authentication enabled

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartbudget.git
   cd smartbudget
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/smartbudget"

   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

   # OpenAI (for AI features)
   OPENAI_API_KEY=your_openai_api_key

   # NextAuth
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Getting Started
1. **Sign Up**: Create an account using Google authentication
2. **Add Transactions**: Start logging your income and expenses
3. **Set Budget Goals**: Define your financial targets
4. **Explore Analytics**: View insights about your spending patterns
5. **Get AI Advice**: Consult the AI advisor for personalized recommendations

### Key Workflows

#### Adding Transactions
1. Navigate to the "New Entry" page
2. Select transaction type (Income/Expense)
3. Choose category and add details
4. Save and view in your dashboard

#### Tax Calculations
1. Go to the Tax section
2. Enter your gross income
3. Select your tax class and state
4. View detailed tax breakdown

#### AI Financial Advice
1. Visit the Advisor section
2. Ask questions about your finances
3. Receive personalized recommendations
4. Implement suggested improvements

## 🏗️ Project Structure

```
smartbudget/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # UI components (buttons, forms, etc.)
│   └── ...               # Feature-specific components
├── lib/                   # Utility functions and configurations
│   ├── store/            # State management (Zustand)
│   ├── translations/     # Internationalization
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── styles/               # Additional stylesheets
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build the image
docker build -t smartbudget .

# Run the container
docker run -p 3000:3000 smartbudget
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure mobile responsiveness

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Vercel** for hosting and deployment
- **Prisma** for the excellent ORM
- **Tailwind CSS** for the utility-first approach
- **OpenAI** for AI capabilities

## 📞 Support

If you have any questions or need help:

- **Issues**: [GitHub Issues](https://github.com/yourusername/smartbudget/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/smartbudget/discussions)
- **Email**: support@smartbudget.app

## 🔄 Changelog

### Version 1.0.0 (Current)
- ✅ Complete mobile optimization
- ✅ AI financial advisor integration
- ✅ German tax calculation system
- ✅ Multi-language support
- ✅ Dark/light theme system
- ✅ Firebase authentication
- ✅ Comprehensive analytics dashboard
- ✅ GDPR compliance

---

**Made with ❤️ for better financial futures**

*SmartBudget - Take control of your money, take control of your future.*