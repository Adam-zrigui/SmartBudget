'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';
import { Suspense, useState } from 'react';

function SignInContent() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const errorParam = params.get('error');
  const [isLoading, setIsLoading] = useState(false);

  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);

  // show error toast if google sign-in failed
  if (errorParam === 'google') {
    toast.toast({ title: language === 'de' ? 'Google-Anmeldung fehlgeschlagen' : 'Google sign-in failed', variant: 'destructive' });
  }

  const handleGoogle = async () => {
    setIsLoading(true);
    // redirect directly via GET to avoid POST body parsing errors on Vercel
    const url = new URL('/api/auth/signin/google', window.location.origin);
    url.searchParams.set('callbackUrl', callbackUrl);
    window.location.href = url.toString();
  };

  const features = [
    {
      icon: '📊',
      title: language === 'de' ? 'Finanzübersicht' : 'Finance Overview',
      desc: language === 'de' ? 'Alle Ihre Konten an einem Ort' : 'All your accounts in one place',
    },
    {
      icon: '🤖',
      title: language === 'de' ? 'KI-Assistent' : 'AI Assistant',
      desc: language === 'de' ? 'Intelligente Finanzberatung' : 'Intelligent financial advice',
    },
    {
      icon: '📈',
      title: language === 'de' ? 'Analytics' : 'Analytics',
      desc: language === 'de' ? 'Detaillierte Berichte & Trends' : 'Detailed reports & trends',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-50 to-base-100 dark:from-base-900 dark:via-base-800 dark:to-base-900 overflow-hidden relative flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0), 0 0 10px rgba(59, 130, 246, 0); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Main content */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-center gap-8 px-4 py-12 max-w-6xl">
        {/* Language Selector - Top Right */}
        <div className="absolute top-4 right-4 flex gap-1 rounded-lg overflow-hidden border border-white/20 dark:border-base-700/30 bg-white/30 dark:bg-base-800/40 backdrop-blur-sm">
          {(['de', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => useLanguageStore.setState({ language: lang })}
              className={`px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                language === lang
                  ? 'bg-primary dark:bg-primary text-white'
                  : 'bg-transparent hover:bg-white/20 dark:hover:bg-base-700/50 opacity-60 hover:opacity-100 text-base-content dark:text-base-100'
              }`}
              title={lang === 'de' ? 'Deutsch' : 'English'}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Left side - Info */}
        <div className="hidden lg:flex flex-col justify-center max-w-md animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight mb-2 animate-in fade-in slide-in-from-left-8 duration-700" style={{ animationDelay: '200ms' }}>
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                SmartBudget
              </span>
            </h1>
            <p className="text-lg opacity-60 animate-in fade-in slide-in-from-left-8 duration-700" style={{ animationDelay: '300ms' }}>
              {language === 'de' ? 'Intelligente Finanzplanung für Ihre Zukunft' : 'Smart financial planning for your future'}
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/30 dark:bg-base-800/40 backdrop-blur-sm border border-white/20 dark:border-base-700/30 hover:bg-white/40 dark:hover:bg-base-700/50 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-left-8 group cursor-pointer"
                style={{ animationDelay: `${400 + i * 150}ms` }}
              >
                <div className="flex gap-3 items-start">
                  <span className="text-3xl animate-float" style={{ animationDelay: `${i * 0.3}s` }}>{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="text-xs opacity-60 group-hover:opacity-80 transition-opacity duration-300">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - SignIn Card */}
        <div className="w-full max-w-sm animate-in fade-in-scale duration-700" style={{ animationDelay: '400ms' }}>
          <div className="bg-white/60 dark:bg-base-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-base-700/20 overflow-hidden hover:shadow-3xl transition-all duration-500 animate-glow">
            {/* Card Header */}
            <div className="px-8 py-10 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 border-b border-white/10 dark:border-base-700/10">
              <h2 className="text-3xl font-bold tracking-tight mb-2 animate-in fade-in slide-in-from-top-4 duration-700" style={{ animationDelay: '500ms' }}>{t.auth.signIn}</h2>
              <p className="text-sm opacity-60 animate-in fade-in slide-in-from-top-4 duration-700" style={{ animationDelay: '600ms' }}>
                {language === 'de' ? 'Melden Sie sich an, um Ihr Konto zu verwalten' : 'Sign in to manage your account'}
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 py-8 space-y-4">
              <button
                onClick={handleGoogle}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 mb-4 transform overflow-hidden relative group ${
                  isLoading
                    ? 'bg-primary/50 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:scale-105 hover:-translate-y-1 active:scale-95 active:translate-y-1 text-white'
                }`}
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {language === 'de' ? 'Wird angemeldet...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                    </svg>
                    <span className="relative">{t.auth.signInWithGoogle}</span>
                  </>
                )}
              </button>

              <div className="relative my-6 animate-in fade-in duration-700" style={{ animationDelay: '650ms' }}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-base-300/30 dark:border-base-700/30"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white/60 dark:bg-base-900/60 text-opacity-60">
                    {language === 'de' ? 'Oder' : 'Or'}
                  </span>
                </div>
              </div>

            </div>

            {/* Card Footer */}
            <div className="px-8 py-4 border-t border-white/10 dark:border-base-700/10 bg-white/30 dark:bg-base-900/30 animate-in fade-in duration-700" style={{ animationDelay: '750ms' }}>
              <p className="text-xs opacity-50 text-center">
                {language === 'de'
                  ? 'Sichere Anmeldung mit Google. Ihre Daten sind geschützt.'
                  : 'Secure sign-in with Google. Your data is protected.'}
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex justify-center gap-4 text-xs opacity-60 flex-wrap animate-in fade-in duration-700" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center gap-1 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-default group">
              <span className="text-lg group-hover:animate-bounce">🔒</span>
              {language === 'de' ? 'Sicher' : 'Secure'}
            </div>
            <div className="flex items-center gap-1 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-default group">
              <span className="text-lg group-hover:animate-pulse">⚡</span>
              {language === 'de' ? 'Schnell' : 'Fast'}
            </div>
            <div className="flex items-center gap-1 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-default group">
              <span className="text-lg group-hover:animate-bounce">🛡️</span>
              {language === 'de' ? 'Privat' : 'Private'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 via-base-50 to-base-100 dark:from-base-900 dark:via-base-800 dark:to-base-900">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <span className="loading loading-spinner loading-lg text-primary animate-spin"></span>
          <p className="text-sm opacity-60 animate-pulse">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
