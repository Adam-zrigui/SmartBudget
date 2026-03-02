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

interface SessionItem {
  id: string;
  sessionToken: string;
  expires: string;
}

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const language = useLanguageStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [message, setMessage] = useState('');
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
  useEffect(() => setMounted(true), []);

  if (status === 'loading') return <div className="p-8">Loading...</div>;
  if (!session) { router.push('/auth/signin'); return null; }

  const isDark = mounted && resolvedTheme === 'dark';

  useEffect(() => {
    fetch('/api/user/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data || []))
      .catch(console.error);
  }, []);

  const revoke = (token: string) => {
    fetch(`/api/user/sessions?token=${encodeURIComponent(token)}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSessions((s) => s.filter((x) => x.sessionToken !== token));
          setMessage(language === 'de' ? 'Sitzung widerrufen' : 'Session revoked');
          setTimeout(() => setMessage(''), 3000);
        }
      })
      .catch(console.error);
  };

  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header tab="profile" txsLength={0} exportCSV={() => {}} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">
                {language === 'de' ? 'Aktive Sitzungen' : 'Active Sessions'}
              </h1>
              <p className="text-base-content/60">
                {language === 'de' ? 'Verwalte deine aktiven Anmeldungen' : 'Manage your active logins'}
              </p>
            </div>

            {/* Success Message */}
            {message && (
              <div className="mb-6 animate-in slide-in-from-top-2">
                <div className="p-4 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg border border-green-500/30 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span>{message}</span>
                </div>
              </div>
            )}

            {/* Sessions List */}
            {sessions.length === 0 ? (
              <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl p-12 border border-base-300/50 shadow-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-base-content/60 text-lg">
                  {language === 'de' ? 'Keine aktiven Sitzungen gefunden' : 'No active sessions found'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-6 border border-base-300/50 hover:border-primary/50 transition-all shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 1a11 11 0 1011 11A11 11 0 0012 1zm0 20a9 9 0 110-18 9 9 0 0110 18zm3.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">{language === 'de' ? 'Sitzung' : 'Session'} #{session.id.slice(0, 8)}</h3>
                            <p className="text-sm text-base-content/60">Token: {session.sessionToken.slice(0, 20)}...</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 ml-11">
                          <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {language === 'de' ? 'Ablauf: ' : 'Expires: '}
                              {new Date(session.expires).toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-semibold">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              {language === 'de' ? 'Aktiv' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => revoke(session.sessionToken)}
                        className="btn btn-sm btn-outline hover:btn-error transition-all whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {language === 'de' ? 'Widerrufen' : 'Revoke'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Card */}
            <div className="mt-8 bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-6 border border-base-300/50 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent/20 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {language === 'de' ? 'Über Sitzungen' : 'About Sessions'}
                  </h3>
                  <p className="text-sm text-base-content/70">
                    {language === 'de' 
                      ? 'Jede aktive Sitzung repräsentiert eine Anmeldung auf einem Gerät. Du kannst jede Sitzung widerrufen, wenn du dich darin nicht mehr auf diesem Gerät anmelden möchtest. Du solltest verdächtige Sitzungen mit neuen Geräten sofort widerrufen.' 
                      : 'Each active session represents a login on a device. You can revoke any session if you no longer want to be logged in on that device. You should revoke any suspicious sessions from unknown devices immediately.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AI Advisor */}
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
