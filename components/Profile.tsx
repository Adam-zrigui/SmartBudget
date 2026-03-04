'use client';

import { useAuth } from '@/components/AuthContext';
import { useState, useEffect, useId } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import Advisor from "./Advisor";

export interface ProfileProps {
  setTab?: (tab: string) => void;
}

export default function Profile({ setTab }: ProfileProps) {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const language = useLanguageStore((s) => s.language);
  const t = translations[language];
  
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const popoverId = useId();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email || '');
      setSavedEmail(user.email || null);
    }
  }, [user]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: language === 'de' ? 'Abgemeldet' : 'Signed out',
      });
      window.location.href = '/auth/signin';
    } catch (error) {
      toast({
        title: language === 'de' ? 'Fehler beim Abmelden' : 'Sign out failed',
        variant: 'destructive',
      });
      setIsSigningOut(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/transactions/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: language === 'de' ? 'Export erfolgreich' : 'Export successful',
      });
    } catch (err: any) {
      toast({
        title: language === 'de' ? 'Export fehlgeschlagen' : 'Export failed',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg" />
          <p className="text-sm opacity-60">{language === 'de' ? 'Laden...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">{language === 'de' ? 'Authentifizierung erforderlich' : 'Authentication Required'}</p>
          <Link href="/auth/signin?redirect=/profile" className="btn btn-primary">
            {language === 'de' ? 'Anmelden' : 'Sign In'}
          </Link>
        </div>
      </div>
    );
  }

  const userEmail = user.email || '';
  const userDisplayName = user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div className="animate-page-enter">
      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {language === 'de' ? 'Mein Profil' : 'My Profile'}
        </h1>
        <p className="text-base-content/60">
          {language === 'de' ? 'Verwalte deine Kontoinformationen und Einstellungen' : 'Manage your account information and settings'}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl p-8 border border-base-300/50 shadow-lg sticky top-24">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl border-4 border-primary/20">
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary-content" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-base-100 shadow-lg" />
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">{userDisplayName}</h2>
              <p className="text-sm text-base-content/60 break-words">{userEmail}</p>
              <div className="mt-3 inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                {language === 'de' ? 'Premium Nutzer' : 'Premium Member'}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Link 
                href="/?tab=transactions" 
                className="flex items-center justify-center gap-2 w-full btn btn-primary/20 btn-outline hover:btn-primary transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {language === 'de' ? 'Transaktionen' : 'Transactions'}
              </Link>
              <button 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center justify-center gap-2 w-full btn btn-outline hover:btn-error transition-all disabled:loading"
              >
                {isSigningOut ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    {language === 'de' ? 'Wird abgemeldet...' : 'Signing out...'}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {language === 'de' ? 'Abmelden' : 'Sign Out'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl p-8 border border-base-300/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {language === 'de' ? 'Profilinformationen' : 'Profile Information'}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {language === 'de' ? 'Deine persönlichen Daten' : 'Your personal data'}
                  </p>
                </div>
              </div>
              {!editing && (
                <button 
                  onClick={() => setEditing(true)}
                  className="btn btn-sm btn-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {language === 'de' ? 'Bearbeiten' : 'Edit'}
                </button>
              )}
            </div>

            {!editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-base-200/40 rounded-xl border border-base-300/30 hover:border-primary/50 transition-colors">
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    {language === 'de' ? 'E-Mail Adresse' : 'Email Address'}
                  </label>
                  <p className="text-lg font-medium mt-2 break-words">{savedEmail || userEmail || '-'}</p>
                </div>
                <div className="p-4 bg-base-200/40 rounded-xl border border-base-300/30 hover:border-primary/50 transition-colors">
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    {language === 'de' ? 'Benutzerkennungsnummer' : 'User ID'}
                  </label>
                  <p className="text-lg font-medium mt-2 font-mono text-sm break-all">{user.uid?.slice(0, 12)}...</p>
                </div>
                <div className="p-4 bg-base-200/40 rounded-xl border border-base-300/30">
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    {language === 'de' ? 'Konto erstellt' : 'Account Created'}
                  </label>
                  <p className="text-lg font-medium mt-2">
                    {user.metadata?.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-base-200/40 rounded-xl border border-base-300/30">
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    {language === 'de' ? 'Status' : 'Status'}
                  </label>
                  <p className="text-lg font-medium mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {language === 'de' ? 'Aktiv' : 'Active'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setSavedEmail(emailInput);
                  setEditing(false);
                  toast({
                    title: language === 'de' ? 'Änderungen gespeichert' : 'Changes saved',
                  });
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {language === 'de' ? 'E-Mail Adresse' : 'Email Address'}
                  </label>
                  <input 
                    type="email"
                    value={emailInput} 
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder={language === 'de' ? 'deine@email.de' : 'your@email.com'}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 btn btn-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {language === 'de' ? 'Speichern' : 'Save'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEmailInput(savedEmail ?? userEmail ?? '');
                    }}
                    className="flex-1 btn btn-ghost"
                  >
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-6 border border-base-300/50 shadow-lg">
              <div className="text-base-content/60 text-sm font-semibold">
                {language === 'de' ? 'Authentifizierung' : 'Authentication'}
              </div>
              <div className="text-2xl font-bold mt-2">✓ {language === 'de' ? 'Aktiv' : 'Active'}</div>
              <p className="text-xs text-base-content/50 mt-1">
                {language === 'de' ? 'Konto gesichert' : 'Account secure'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-6 border border-base-300/50 shadow-lg">
              <div className="text-base-content/60 text-sm font-semibold">
                {language === 'de' ? 'Abo-Plan' : 'Plan'}
              </div>
              <div className="text-2xl font-bold mt-2">Premium</div>
              <p className="text-xs text-base-content/50 mt-1">
                {language === 'de' ? 'Alle Features' : 'All features'}
              </p>
            </div>
          </div>

          {/* Data Export Card */}
          <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl p-8 border border-base-300/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-accent/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {language === 'de' ? 'Daten & Export' : 'Data & Export'}
                </h3>
                <p className="text-sm text-base-content/60">
                  {language === 'de' ? 'Lade deine Daten herunter' : 'Download your data'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleExport('csv')}
                className="flex-1 btn btn-outline hover:btn-primary transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {language === 'de' ? 'CSV Exportieren' : 'Export CSV'}
              </button>
              <button 
                onClick={() => handleExport('json')}
                className="flex-1 btn btn-outline hover:btn-secondary transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {language === 'de' ? 'JSON Exportieren' : 'Export JSON'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Advisor hidden in profile tab version (shown via floating button in BudgetTracker) */}
    </div>
  );
}
