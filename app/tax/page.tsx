'use client'

import { useState, useEffect, useId } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/lib/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileDrawer from '@/components/MobileDrawer';
import Tax from '@/components/Tax';
import Advisor from '@/components/Advisor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { calcGermanTax } from '@/lib/utils';

const DE_TAX_CLASSES = [
  { id: 1, label: 'I - Single' },
  { id: 2, label: 'II - Single with children' },
  { id: 3, label: 'III - Married (main earner)' },
  { id: 4, label: 'IV - Married (equal)' },
  { id: 5, label: 'V - Married (secondary)' },
  { id: 6, label: 'VI - Multiple jobs' },
];

const DE_STATES = [
  { id: 'BW', label: 'Baden-Württemberg' },
  { id: 'BY', label: 'Bavaria' },
  { id: 'BE', label: 'Berlin' },
  { id: 'BB', label: 'Brandenburg' },
  { id: 'HB', label: 'Bremen' },
  { id: 'HH', label: 'Hamburg' },
  { id: 'HE', label: 'Hesse' },
  { id: 'MV', label: 'Mecklenburg-Vorpommern' },
  { id: 'NI', label: 'Lower Saxony' },
  { id: 'NW', label: 'North Rhine-Westphalia' },
  { id: 'RP', label: 'Rhineland-Palatinate' },
  { id: 'SL', label: 'Saarland' },
  { id: 'SN', label: 'Saxony' },
  { id: 'ST', label: 'Saxony-Anhalt' },
  { id: 'SH', label: 'Schleswig-Holstein' },
  { id: 'TH', label: 'Thuringia' },
];

const TAG = {};

export default function TaxPage() {
  const { resolvedTheme } = useTheme();
  const language = useLanguageStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const popoverId = useId();
  const [tax, setTax] = useState({
    grossMonthly: 3000,
    taxClass: 1,
    state: 'NW',
    kirchenmitglied: false,
    hasKinder: false,
  });
  const [taxResult, setTaxResult] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

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

  // Calculate tax whenever tax params change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const result = await calcGermanTax(tax);
        if (!cancelled) {
          setTaxResult(result);
        }
      } catch (err) {
        console.error('Tax calculation error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tax]);

  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  return (
    <div>
      <div className="flex min-h-screen bg-base-100 text-base-content">
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          taxResult={taxResult}
          txsLength={0}
          tab="tax"
          setTab={handleTabChange}
        />

        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar taxResult={taxResult} txsLength={0} tab="tax" setTab={handleTabChange} />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <Header
            tab="tax"
            txsLength={0}
            exportCSV={() => {}}
            onHamburger={() => setDrawerOpen(o => !o)}
          />
          <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-base-100">
            <div className="max-w-6xl mx-auto">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-8 w-48 bg-base-200 rounded animate-pulse" />
                  <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8 space-y-6">
                    <div className="h-6 bg-base-200 rounded animate-pulse" />
                    <div className="h-6 bg-base-200 rounded animate-pulse" />
                    <div className="h-6 bg-base-200 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <Tax
                  tax={tax}
                  setTax={setTax}
                  taxResult={taxResult}
                  DE_TAX_CLASSES={DE_TAX_CLASSES}
                  DE_STATES={DE_STATES}
                  TAG={TAG}
                />
              )}
            </div>
          </main>
        </div>
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
