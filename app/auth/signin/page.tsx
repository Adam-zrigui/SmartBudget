"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ArrowUpRight, Check, LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useLanguageStore } from "@/lib/store";
import { useTranslations } from "@/lib/translations";

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#b3ff83] text-[#030303] ${small ? "size-8" : "size-10"}`}>
      <svg viewBox="0 0 32 32" className={small ? "size-6" : "size-8"} aria-hidden="true">
        <path
          d="M6 8.5h12.4c4.9 0 7.6 2.4 7.6 6.1 0 2.7-1.5 4.7-4 5.7 3.2.8 5 2.9 5 5.8 0 4.1-3.1 6.4-8.4 6.4H6V8.5Zm10.8 9.7c2.1 0 3.3-.8 3.3-2.4 0-1.5-1.2-2.3-3.3-2.3h-5v4.7h5Zm.7 9.1c2.4 0 3.7-.9 3.7-2.7 0-1.7-1.3-2.6-3.7-2.6h-5.7v5.3h5.7Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function SignInContent() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const language = useLanguageStore((state) => state.language);
  const t = useTranslations(language);

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      const response = await fetch("/api/auth/set-token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });
      if (!response.ok) throw new Error("Token cookie set failed");

      await new Promise((resolve) => setTimeout(resolve, 200));
      const verifyResponse = await fetch("/api/auth/verify", { credentials: "include" });
      if (!verifyResponse.ok) {
        throw new Error(
          language === "de"
            ? "Anmeldung unvollständig. Bitte Firebase-Server-Konfiguration prüfen."
            : "Sign-in incomplete. Please check your Firebase server configuration."
        );
      }

      toast.toast({ title: language === "de" ? "Erfolgreich eingeloggt" : "Successfully signed in" });
      router.replace(callbackUrl);
    } catch (error: any) {
      toast.toast({ title: error?.message || "Sign in failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    language === "de" ? "Alle Konten in einer ruhigen, klaren Ansicht" : "Every account in one calm, clear view",
    language === "de" ? "Budgets, Trends und Sparziele ohne Tabellenchaos" : "Budgets, trends, and goals without spreadsheet chaos",
    language === "de" ? "Ein KI-Berater, der deine nächsten Schritte erklärt" : "An AI advisor that explains your next best step",
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-40 size-[560px] rounded-full bg-[#b3ff83]/[0.09] blur-[110px]" />
        <div className="absolute -bottom-64 -left-32 size-[560px] rounded-full bg-[#83b8ff]/[0.07] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <div className="text-[16px] font-semibold tracking-[-0.04em]">SmartBudget</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">Personal finance</div>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-1">
            {(["de", "en"] as const).map((locale) => (
              <button
                key={locale}
                onClick={() => useLanguageStore.setState({ language: locale })}
                className={`h-8 min-w-10 rounded-lg px-3 text-[10px] font-semibold transition ${language === locale ? "bg-white text-[#030303]" : "text-white/38 hover:text-white/70"}`}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-20">
          <section className="max-w-[630px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b3ff83]/20 bg-[#b3ff83]/[0.07] px-3 py-2 text-[10px] font-semibold text-[#b3ff83]">
              <Sparkles className="size-3.5" />
              {language === "de" ? "Finanzen, die sich leicht anfühlen" : "Money that feels refreshingly simple"}
            </div>
            <h1 className="max-w-[620px] text-[clamp(44px,6vw,76px)] font-medium leading-[0.96] tracking-[-0.07em]">
              {language === "de" ? (
                <>Dein Geld.<br /><span className="text-[#b3ff83]">Klarer gedacht.</span></>
              ) : (
                <>Your money.<br /><span className="text-[#b3ff83]">Clearly planned.</span></>
              )}
            </h1>
            <p className="mt-7 max-w-[520px] text-[14px] leading-6 text-white/42 sm:text-[15px]">
              {language === "de"
                ? "SmartBudget bringt Ausgaben, Budgets, Sparziele und vernünftige nächste Schritte in ein fokussiertes Erlebnis."
                : "SmartBudget brings spending, budgets, goals, and sensible next steps into one focused experience."}
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                { icon: TrendingUp, value: "1 view", label: language === "de" ? "für alle Finanzen" : "for every account" },
                { icon: Sparkles, value: "24/7", label: language === "de" ? "klarer Rat" : "clear guidance" },
                { icon: LockKeyhole, value: "Private", label: language === "de" ? "und sicher" : "by design" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.value} className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-4">
                    <Icon className="size-4 text-[#b3ff83]" />
                    <div className="mt-4 text-[12px] font-medium">{item.value}</div>
                    <div className="mt-1 text-[9px] text-white/28">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="w-full max-w-[440px] justify-self-center rounded-[26px] border border-white/[0.09] bg-[#111111] p-5 shadow-[0_35px_100px_rgba(0,0,0,0.45)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[26px] font-medium tracking-[-0.05em]">{language === "de" ? "Willkommen zurück" : "Welcome back"}</h2>
                <p className="mt-2 text-[11px] leading-5 text-white/35">{language === "de" ? "Melde dich an, um deine Finanzen zu sehen." : "Sign in to continue to your finances."}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#b3ff83] text-[#030303]"><ArrowUpRight className="size-4" /></span>
            </div>

            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-[12px] font-semibold text-[#181819] transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-[#181819]/20 border-t-[#181819]" />
              ) : (
                <svg className="size-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {isLoading ? (language === "de" ? "Wird angemeldet…" : "Signing you in…") : t.auth.signInWithGoogle}
            </button>

            <div className="my-7 h-px bg-white/[0.075]" />
            <div className="space-y-3.5">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 text-[10px] leading-4 text-white/42">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#b3ff83]/10 text-[#b3ff83]"><Check className="size-2.5" strokeWidth={3} /></span>
                  {benefit}
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-center gap-2 text-[9px] text-white/22">
              <LockKeyhole className="size-3" />
              {language === "de" ? "Sichere Anmeldung · Deine Daten bleiben privat" : "Secure sign-in · Your data stays private"}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#030303] text-white"><span className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-[#b3ff83]" /></main>}>
      <SignInContent />
    </Suspense>
  );
}
