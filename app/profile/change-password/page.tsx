'use client'

import { useState, useEffect, useId } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useLanguageStore } from '@/lib/store';
import Advisor from '@/components/Advisor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function ChangePasswordContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const language = useLanguageStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const popoverId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onAiMessage(e: any) {
      if (!chatOpen) setUnread((prev) => prev + 1);
    }
    window.addEventListener('ai:message', onAiMessage as EventListener);
    return () => window.removeEventListener('ai:message', onAiMessage as EventListener);
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen) setUnread(0);
  }, [chatOpen]);

  if (status === 'loading') return <div className="p-8">Loading...</div>;
  if (!session) { router.push('/auth/signin'); return null; }

  const isDark = mounted && resolvedTheme === 'dark';

  const calculatePasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: language === 'de' ? 'Schwach' : 'Weak', color: 'bg-red-500' },
      { score: 2, label: language === 'de' ? 'Mittel' : 'Fair', color: 'bg-yellow-500' },
      { score: 3, label: language === 'de' ? 'Gut' : 'Good', color: 'bg-blue-500' },
      { score: 4, label: language === 'de' ? 'Stark' : 'Strong', color: 'bg-green-500' },
      { score: 5, label: language === 'de' ? 'Sehr stark' : 'Very Strong', color: 'bg-green-600' },
    ];
    return levels[Math.min(score, 5)];
  };

  const strengthNew = calculatePasswordStrength(newPass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirm) {
      toast({
        title: language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    const res = await fetch('/api/user/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({
        title: language === 'de' ? 'Passwort geändert' : 'Password changed',
      });
      setTimeout(() => router.back(), 1500);
    } else {
      toast({
        title: data.error || 'Error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar taxResult={{}} txsLength={0} tab="profile" setTab={() => {}} />
        </div>
        <div className="drawer lg:hidden">
          <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />
          <div className="drawer-side z-50">
            <label htmlFor="sidebar-toggle" className="drawer-overlay lg:hidden" />
            <Sidebar taxResult={{}} txsLength={0} tab="profile" setTab={() => {}} />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <Header tab="profile" txsLength={0} exportCSV={() => {}} />
          <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
            <div className="max-w-xl mx-auto">
              <div className="relative bg-gradient-to-br from-base-100 to-base-200 p-8 rounded-3xl shadow-2xl border border-base-300/50 backdrop-blur-sm overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl -ml-20 -mb-20" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {language === 'de' ? 'Passwort ändern' : 'Change Password'}
                      </h2>
                      <p className="text-xs text-base-content/60 mt-1">{language === 'de' ? 'Aktualisieren Sie Ihr Passwort regelmäßig' : 'Update your password regularly'}</p>
                    </div>
                  </div>



                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Current Password */}
                    <div className="group">
                      <Label className="block mb-2 font-semibold text-base">{language === 'de' ? 'Aktuelles Passwort' : 'Current password'}</Label>
                      <div className="relative">
                        <Input
                          type={showCurrent ? 'text' : 'password'}
                          value={current}
                          onChange={(e) => setCurrent(e.target.value)}
                          placeholder="••••••••"
                          className="pr-12 h-11 text-base transition-all duration-200 border-2 border-base-300 focus:border-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent((v) => !v)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content transition-all duration-200 p-1 hover:bg-base-200 rounded-lg"
                          title={showCurrent ? 'Hide' : 'Show'}
                        >
                          {showCurrent ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.095.176-2.148.5-3.135m1.356-2.76A9.969 9.969 0 0112 5c5.523 0 10 4.477 10 10 0 1.095-.176 2.148-.5 3.135" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="group">
                      <Label className="block mb-2 font-semibold text-base">{language === 'de' ? 'Neues Passwort' : 'New password'}</Label>
                      <div className="relative">
                        <Input
                          type={showNew ? 'text' : 'password'}
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          placeholder="••••••••"
                          className="pr-12 h-11 text-base transition-all duration-200 border-2 border-base-300 focus:border-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content transition-all duration-200 p-1 hover:bg-base-200 rounded-lg"
                          title={showNew ? 'Hide' : 'Show'}
                        >
                          {showNew ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.095.176-2.148.5-3.135m1.356-2.76A9.969 9.969 0 0112 5c5.523 0 10 4.477 10 10 0 1.095-.176 2.148-.5 3.135" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {newPass && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  i < strengthNew.score
                                    ? strengthNew.color
                                    : 'bg-base-300'
                                }`}
                              />
                            ))}
                          </div>
                          {strengthNew.label && (
                            <p className={`text-xs font-medium ${strengthNew.color.replace('bg-', 'text-')}`}>
                              {language === 'de' ? 'Stärke: ' : 'Strength: '}{strengthNew.label}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="group">
                      <Label className="block mb-2 font-semibold text-base">{language === 'de' ? 'Bestätigen' : 'Confirm password'}</Label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="••••••••"
                          className={`pr-12 h-11 text-base transition-all duration-200 border-2 focus:border-primary/50 ${
                            confirm && newPass === confirm
                              ? 'border-green-500 focus:border-green-500/50'
                              : confirm && newPass !== confirm
                              ? 'border-red-500 focus:border-red-500/50'
                              : 'border-base-300'
                          }`}
                        />
                        {confirm && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {newPass === confirm ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            ) : confirm ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                              </svg>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="text-base-content/50 hover:text-base-content transition-all duration-200 p-1 hover:bg-base-200 rounded-lg"
                                title={showConfirm ? 'Hide' : 'Show'}
                              >
                                {showConfirm ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.095.176-2.148.5-3.135m1.356-2.76A9.969 9.969 0 0112 5c5.523 0 10 4.477 10 10 0 1.095-.176 2.148-.5 3.135" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary text-primary-content font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </div>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* AI Advisor Popover */}
        <div className="fixed bottom-6 right-6 z-50">
        <Popover open={chatOpen} onOpenChange={(v) => setChatOpen(v)}>
          <PopoverTrigger asChild>
            <button
              className="relative bg-primary dark:bg-secondary text-primary-content dark:text-secondary-content rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
              title="Chat with AI advisor"
              suppressHydrationWarning
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h-1V6a5 5 0 00-10 0v2H5a2 2 0 00-2 2v6a2 2 0 002 2h3v3l4-3h4a2 2 0 002-2v-6a2 2 0 00-2-2z" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-1.5 h-5 min-w-5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent id={popoverId} className="w-80 p-0">
            <Advisor compact onClose={() => setChatOpen(false)} focus={chatOpen} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
    
  );
}

export default ChangePasswordContent;
