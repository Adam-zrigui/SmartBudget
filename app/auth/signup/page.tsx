'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      if (name && userCred.user) {
        await updateProfile(userCred.user, { displayName: name });
      }
      toast.toast({ title: language === 'de' ? 'Registrierung erfolgreich' : 'Sign up successful' });
      router.push('/auth/signin');
    } catch (err: any) {
      toast.toast({ title: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-50 to-base-100 overflow-hidden relative flex items-center justify-center">
      {/* Main content */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/60 dark:bg-base-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-base-700/20 overflow-hidden">
            {/* Card Header */}
            <div className="px-8 py-10 bg-gradient-to-br from-secondary/20 via-transparent to-primary/20 border-b border-white/10">
              <h2 className="text-3xl font-bold tracking-tight mb-2">{t.auth.signUp}</h2>
              <p className="text-sm opacity-60">
                {language === 'de' ? 'Erstellen Sie ein Konto, um zu beginnen' : 'Create an account to get started'}
              </p>
            </div>

            {/* Card Body */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {language === 'de' ? 'Vollständiger Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-base-300/50 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300"
                  placeholder={language === 'de' ? 'Max Mustermann' : 'John Doe'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-base-300/50 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {language === 'de' ? 'Passwort' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-base-300/50 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <p className="text-xs opacity-50 mt-2">
                  {language === 'de' ? 'Mindestens 8 Zeichen' : 'At least 8 characters'}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 mt-6 ${
                  loading
                    ? 'bg-primary/50 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-secondary to-secondary/80 hover:shadow-lg hover:scale-105 active:scale-95 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <span>⏳</span>
                    {language === 'de' ? 'Wird erstellt...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    {t.auth.signUp}
                  </>
                )}
              </button>
            </form>

            {/* Card Footer */}
            <div className="px-8 py-5 border-t border-white/10 bg-white/30 dark:bg-base-900/30">
              <p className="text-sm text-center">
                {t.auth.alreadyMember}{' '}
                <a href="/auth/signin" className="text-primary font-semibold hover:opacity-80 transition-opacity">
                  {t.auth.signIn}
                </a>
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex justify-center gap-4 text-xs opacity-60 flex-wrap">
            <div className="flex items-center gap-1">
              <span>🔐</span>
              {language === 'de' ? 'Verschlüsselt' : 'Encrypted'}
            </div>
            <div className="flex items-center gap-1">
              <span>✅</span>
              {language === 'de' ? 'Verifiziert' : 'Verified'}
            </div>
            <div className="flex items-center gap-1">
              <span>🎯</span>
              {language === 'de' ? 'Sofort bereit' : 'Ready instantly'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
