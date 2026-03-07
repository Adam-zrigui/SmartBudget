'use client'

import { useState, useEffect, useId } from 'react';
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileDrawer from '@/components/MobileDrawer';
import Analytics from '@/components/Analytics';
import Advisor from '@/components/Advisor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const language = useLanguageStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const isDark = mounted && resolvedTheme === 'dark';

  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  // close drawer when navigating (effect moved into MobileDrawer via onNavigate)

  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taxResult={{}}
        txsLength={0}
        tab="analytics"
        setTab={handleTabChange}
      />

      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar taxResult={{}} txsLength={0} tab="analytics" setTab={handleTabChange} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          tab="analytics"
          txsLength={0}
          exportCSV={() => {}}
          onHamburger={() => setDrawerOpen(o => !o)}
        />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <Analytics dark={isDark} />
          </div>
        </main>
      </div>
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
