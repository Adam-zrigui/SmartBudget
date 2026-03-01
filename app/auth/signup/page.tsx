'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';

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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      toast.toast({ title: 'Registrierung erfolgreich' });
      router.push('/auth/signin');
    } catch (err: any) {
      toast.toast({ title: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="w-full max-w-md p-8 bg-base-200 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6">{t.auth.signUp}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">{language === 'de' ? 'Name' : 'Name'}</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              className="input input-bordered w-full"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{language === 'de' ? 'Passwort' : 'Password'}</label>
            <input
              type="password"
              required
              className="input input-bordered w-full"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (language === 'de' ? 'Wird geladen...' : 'Loading...') : t.auth.signUp}
          </button>
        </form>
        <p className="mt-4 text-sm">
          {t.auth.alreadyMember}{' '}
          <a href="/auth/signin" className="text-primary font-medium">
            {t.auth.signIn}
          </a>
        </p>
      </div>
    </div>
  );
}
