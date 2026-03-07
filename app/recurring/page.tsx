'use client'

import { useState, useEffect, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileDrawer from '@/components/MobileDrawer';
import RecurringManager from '@/components/RecurringManager';
import Advisor from '@/components/Advisor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { authedFetch } from '@/lib/client-auth';

export default function RecurringPage() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
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

  const loadRecurring = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const res = await authedFetch('/api/recurring-transactions');
      if (res.status === 401) {
        setRecurringTransactions([]);
        setLoadError('Bitte melde dich an, um wiederkehrende Buchungen zu sehen.');
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load recurring transactions (${res.status})`);
      }
      const data = await res.json();
      setRecurringTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading recurring transactions:', err);
      setLoadError('Konnte wiederkehrende Buchungen nicht laden. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecurring();
  }, [loadRecurring]);

  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  async function createRecurring(recurring: any) {
    try {
      const res = await authedFetch('/api/recurring-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recurring),
      });
      if (!res.ok) throw new Error(`Failed to create recurring transaction (${res.status})`);
      const created = await res.json();
      setRecurringTransactions((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('createRecurring error', err);
      throw err;
    }
  }

  async function updateRecurring(id: string, recurring: any) {
    try {
      const res = await authedFetch(`/api/recurring-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recurring, id }),
      });
      if (!res.ok) throw new Error(`Failed to update recurring transaction (${res.status})`);
      const updated = await res.json();
      setRecurringTransactions((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    } catch (err) {
      console.error('updateRecurring error', err);
      throw err;
    }
  }

  async function deleteRecurring(id: string) {
    try {
      const res = await authedFetch(`/api/recurring-transactions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to delete recurring transaction (${res.status})`);
      setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      console.error('deleteRecurring error', err);
      throw err;
    }
  }

  async function toggleRecurringActive(id: string, active: boolean) {
    try {
      const res = await authedFetch(`/api/recurring-transactions/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active }),
      });
      if (!res.ok) throw new Error(`Failed to toggle recurring transaction (${res.status})`);
      const updated = await res.json();
      setRecurringTransactions((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    } catch (err) {
      console.error('toggleRecurringActive error', err);
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
        tab="recurring"
        setTab={handleTabChange}
      />

      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar taxResult={{}} txsLength={0} tab="recurring" setTab={handleTabChange} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          tab="recurring"
          txsLength={0}
          exportCSV={() => {}}
          onHamburger={() => setDrawerOpen(o => !o)}
        />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <div className="mb-4 flex justify-end">
              <Button variant="outline" onClick={() => loadRecurring(true)} disabled={refreshing}>
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
              <RecurringManager
                recurringTransactions={recurringTransactions}
                onCreateRecurring={createRecurring}
                onUpdateRecurring={updateRecurring}
                onDeleteRecurring={deleteRecurring}
                onToggleActive={toggleRecurringActive}
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
