'use client'

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setNameInput(session.user.name || '');
      setEmailInput(session.user.email || '');
      setSavedName(session.user.name || null);
      setSavedEmail(session.user.email || null);
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    // not signed in, redirect to signin
    router.push('/auth/signin');
    return null;
  }

  const user = session.user;
  

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.toast({ title: language === 'de' ? 'Abgemeldet' : 'Signed out' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-base-100 py-12">
      <div className="ui-container mx-auto px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: avatar & quick actions */}
            <aside className="col-span-1 bg-base-100 border border-base-200/50 rounded-2xl p-6 flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-md">
              <img src={user?.image || '/avatar.png'} alt={user?.name ?? 'User'} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-semibold text-center">{user?.name}</h3>
            <p className="text-xs opacity-60 text-center break-words">{user?.email}</p>

            <div className="w-full mt-4">
              <a href="/" className="btn btn-outline w-full mb-2">{language === 'de' ? 'Zurück zur Übersicht' : 'Back to overview'}</a>
              <button onClick={() => setEditing(true)} className="btn btn-primary w-full mb-2">{language === 'de' ? 'Profil bearbeiten' : 'Edit profile'}</button>
              <button onClick={handleSignOut} className="btn btn-ghost w-full">{t.auth.signOut}</button>
            </div>
          </aside>

          {/* Right column: details */}
          <section className="col-span-2 space-y-6">
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold">{language === 'de' ? 'Profilübersicht' : 'Profile overview'}</h2>
                  <p className="text-sm opacity-60 mt-1">{language === 'de' ? 'Kontoinformationen und Einstellungen' : 'Account information and settings'}</p>
                </div>
              </div>

              <div className="mt-6">
                {!editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-base-200/40 rounded-lg">
                      <div className="text-xs opacity-60">{language === 'de' ? 'Name' : 'Name'}</div>
                      <div className="font-medium mt-1">{savedName ?? user?.name}</div>
                    </div>
                    <div className="p-4 bg-base-200/40 rounded-lg">
                      <div className="text-xs opacity-60">Email</div>
                      <div className="font-medium mt-1 break-words">{savedEmail ?? user?.email}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={async (e) => { e.preventDefault();
                    // try to persist changes
                    try {
                      const res = await fetch('/api/user', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: nameInput, email: emailInput }),
                      });
                      if (!res.ok) throw new Error('Save failed');
                      setSavedName(nameInput);
                      setSavedEmail(emailInput);
                      setEditing(false);
                      toast.toast({ title: language === 'de' ? 'Änderungen gespeichert' : 'Changes saved' });
                    } catch (err: any) {
                      toast.toast({ title: err?.message || (language === 'de' ? 'Speichern fehlgeschlagen' : 'Save failed'), variant: 'destructive' });
                    }
                  }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-base-200/40 rounded-lg">
                      <div className="text-xs opacity-60">{language === 'de' ? 'Name' : 'Name'}</div>
                      <input className="input input-bordered w-full mt-1" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
                    </div>
                    <div className="p-4 bg-base-200/40 rounded-lg">
                      <div className="text-xs opacity-60">Email</div>
                      <input className="input input-bordered w-full mt-1" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2 flex gap-2 mt-2">
                      <button type="submit" className="btn btn-primary">{language === 'de' ? 'Speichern' : 'Save'}</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setNameInput(savedName ?? user?.name ?? ''); setEmailInput(savedEmail ?? user?.email ?? ''); }}>{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold">{language === 'de' ? 'Daten & Export' : 'Data & Export'}</h3>
              <p className="text-sm opacity-60 mt-1">{language === 'de' ? 'Lade eine Kopie deiner Transaktionen herunter.' : 'Download a copy of your transactions.'}</p>
              <div className="mt-4 flex gap-2">
                <button disabled title={language === 'de' ? 'Noch nicht implementiert' : 'Not implemented yet'} className="btn btn-outline opacity-60 cursor-not-allowed">{language === 'de' ? 'CSV exportieren' : 'Export CSV'}</button>
                <button className="btn btn-ghost">{language === 'de' ? 'API Token' : 'API Token'}</button>
              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}
