'use client'

import { useState, useEffect, useId, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/lib/store';
import Header from '@/components/Header';
import PageAnimationWrapper from '@/components/PageAnimationWrapper';
import Sidebar from '@/components/Sidebar';
import Transactions from '@/components/Transactions';
import TransactionsLoading from '@/components/TransactionsLoading';
import Advisor from '@/components/Advisor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const language = useLanguageStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fMonth, setFMonth] = useState('all');
  const [fType, setFType] = useState('all');
  const [q, setQ] = useState('');
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

  // Fetch transactions once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (status !== 'authenticated') return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setAllTransactions(data || []);
      } catch (err) {
        console.error('Error loading transactions:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true };
  }, [status]);

  // Memoize filter functions to prevent unnecessary re-renders
  const setFTypeCallback = useCallback((type: string) => setFType(type), []);
  const setFMonthCallback = useCallback((month: string) => setFMonth(month), []);
  const setQCallback = useCallback((query: string) => setQ(query), []);

  // Filter transactions client-side (memoized)
  const filtered = useMemo(() => {
    let result = allTransactions || [];
    
    if (fType !== 'all') {
      result = result.filter((t: any) => t.type === fType);
    }
    
    if (fMonth !== 'all') {
      result = result.filter((t: any) => {
        const d = new Date(t.date);
        return d.getMonth() === parseInt(fMonth);
      });
    }
    
    if (q) {
      result = result.filter((t: any) => 
        t.description?.toLowerCase().includes(q.toLowerCase()) ||
        t.category?.toLowerCase().includes(q.toLowerCase())
      );
    }
    
    return result;
  }, [allTransactions, fMonth, fType, q]);

  // Memoize balance calculation
  const balance = useMemo(() => {
    return filtered.reduce((sum: number, t: any) => {
      const amount = t.type === 'income' ? t.amount : -t.amount;
      return sum + (amount || 0);
    }, 0);
  }, [filtered]);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  if (isLoading) {
    return <TransactionsLoading />;
  }

  return (
    <PageAnimationWrapper>
    <div className="flex min-h-screen bg-base-100 text-base-content">
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar taxResult={{}} txsLength={filtered.length} tab="transactions" setTab={() => {}} />
        </div>

        <div className="drawer lg:hidden">
          <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />
          <div className="drawer-side z-50">
            <label htmlFor="sidebar-toggle" className="drawer-overlay lg:hidden" />
            <Sidebar taxResult={{}} txsLength={filtered.length} tab="transactions" setTab={() => {}} />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <Header tab="transactions" txsLength={filtered.length} exportCSV={() => {}} />
          <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-base-100">
            <div className="max-w-6xl mx-auto">
              <Transactions
                filtered={filtered}
                bal={balance}
                cur="EUR"
                fMonth={fMonth}
                setFMonth={setFMonthCallback}
                fType={fType}
                setFType={setFTypeCallback}
                q={q}
                setQ={setQCallback}
                openEdit={() => {}}
                setDelId={() => {}}
              />
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
    </PageAnimationWrapper>
  );
}
