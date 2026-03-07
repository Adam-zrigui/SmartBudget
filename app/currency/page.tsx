'use client'

import { useState, useEffect, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileDrawer from '@/components/MobileDrawer';
import CurrencyConverter from '@/components/CurrencyConverter';
import Advisor from '@/components/Advisor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { authedFetch } from '@/lib/client-auth';

export default function CurrencyPage() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [baseCurrency, setBaseCurrencyState] = useState<string>('EUR');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const loadCurrencies = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const res = await authedFetch('/api/currencies');
      if (!res.ok) throw new Error('Failed to load currencies');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const base = list.find((currency: any) => currency?.isBase)?.code;
      setCurrencies(list);
      if (base) setBaseCurrencyState(base);
    } catch (err) {
      console.error('Error loading currencies:', err);
      setLoadError('Konnte Waehrungen nicht laden. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  async function updateRates() {
    try {
      const res = await authedFetch('/api/currencies/update-rates', {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Failed to update rates (${res.status})`);
      const updated = await res.json();
      const list = Array.isArray(updated) ? updated : [];
      setCurrencies(list);
      const base = list.find((currency: any) => currency?.isBase)?.code;
      if (base) setBaseCurrencyState(base);
    } catch (err) {
      console.error('updateRates error', err);
      throw err;
    }
  }

  async function setBaseCurrency(currencyCode: string) {
    try {
      const res = await authedFetch('/api/currencies/set-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCurrency: currencyCode }),
      });
      if (!res.ok) throw new Error(`Failed to set base currency (${res.status})`);
      setBaseCurrencyState(currencyCode);
      const updated = await res.json();
      const list = Array.isArray(updated) ? updated : [];
      if (list.length > 0) {
        setCurrencies(list);
      } else {
        const res2 = await authedFetch('/api/currencies');
        if (res2.ok) {
          const data = await res2.json();
          setCurrencies(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error('setBaseCurrency error', err);
      throw err;
    }
  }

  async function addCurrency(currency: { code: string; name?: string; exchangeRate?: number }) {
    try {
      const res = await authedFetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currency),
      });
      if (!res.ok) throw new Error(`Failed to add currency (${res.status})`);
      const created = await res.json();
      setCurrencies((prev) => {
        const withoutExisting = prev.filter((c) => c.code !== created.code);
        return [...withoutExisting, created].sort((a, b) => a.code.localeCompare(b.code));
      });
    } catch (err) {
      console.error('addCurrency error', err);
      throw err;
    }
  }

  async function removeCurrency(currencyCode: string) {
    try {
      const res = await authedFetch('/api/currencies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currencyCode }),
      });
      if (!res.ok) throw new Error(`Failed to remove currency (${res.status})`);
      setCurrencies((prev) => prev.filter((currency) => currency.code !== currencyCode));
    } catch (err) {
      console.error('removeCurrency error', err);
      throw err;
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taxResult={{}}
        txsLength={0}
        tab="currency"
        setTab={handleTabChange}
      />

      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar taxResult={{}} txsLength={0} tab="currency" setTab={handleTabChange} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          tab="currency"
          txsLength={0}
          exportCSV={() => {}}
          onHamburger={() => setDrawerOpen(o => !o)}
        />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <div className="mb-4 flex justify-end">
              <Button variant="outline" onClick={() => loadCurrencies(true)} disabled={refreshing}>
                {refreshing ? 'Aktualisiert...' : 'Aktualisieren'}
              </Button>
            </div>
            {loadError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loadError}
              </div>
            )}
            {loading ? (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-md bg-base-200" />
                <div className="h-24 animate-pulse rounded-md bg-base-200" />
                <div className="h-24 animate-pulse rounded-md bg-base-200" />
              </div>
            ) : (
              <CurrencyConverter
                currencies={currencies}
                baseCurrency={baseCurrency}
                updateRates={updateRates}
                setBaseCurrency={setBaseCurrency}
                addCurrency={addCurrency}
                removeCurrency={removeCurrency}
              />
            )}
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
          <PopoverContent
            className="w-80 p-0 border-0 shadow-2xl"
            side="top"
            align="end"
            id={popoverId}
          >
            <Advisor compact onClose={() => setChatOpen(false)} focus={chatOpen} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
