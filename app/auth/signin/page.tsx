'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';

export default function SignInPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';

  const handleGoogle = async () => {
    const res = await signIn('google', { redirect: false, callbackUrl });
    if (res?.error) {
      toast.toast({ title: res.error, variant: 'destructive' });
    } else {
      toast.toast({ title: language === 'de' ? 'Erfolgreich eingeloggt' : 'Successfully signed in' });
      router.push(callbackUrl);
    }
  };

  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="w-full max-w-md bg-base-100 rounded-3xl shadow-lg border border-base-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="px-6 py-8 border-b border-base-200/30">
          <h1 className="text-2xl font-bold tracking-tight">{t.auth.signIn}</h1>
          <p className="text-sm opacity-50 mt-1">{t.auth.signInWithGoogle}</p>
        </div>
        <div className="px-6 py-8">
          <button
            onClick={handleGoogle}
            className="btn btn-outline btn-primary w-full gap-2"
          >
            <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
            {t.auth.signInWithGoogle}
          </button>
        </div>
      </div>
    </div>
  );
}
