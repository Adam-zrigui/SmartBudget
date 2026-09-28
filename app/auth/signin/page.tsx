"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ArrowUpRight, Check, LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useLanguageStore } from "@/lib/store";
import { useTranslations } from "@/lib/translations";

function BrandMark({ className = "size-11" }: { className?: string }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#b3ff83] text-[#030303] ${className}`}
    >
      <svg viewBox="0 0 32 32" className="size-[70%]" aria-hidden="true">
        <path
          d="M6 8.5h12.4c4.9 0 7.6 2.4 7.6 6.1 0 2.7-1.5 4.7-4 5.7 3.2.8 5 2.9 5 5.8 0 4.1-3.1 6.4-8.4 6.4H6V8.5Zm10.8 9.7c2.1 0 3.3-.8 3.3-2.4 0-1.5-1.2-2.3-3.3-2.3h-5v4.7h5Zm.7 9.1c2.4 0 3.7-.9 3.7-2.7 0-1.7-1.3-2.6-3.7-2.6h-5.7v5.3h5.7Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Right-hand showcase: a lightweight mock of the real dashboard so  *
 * the split reads as "this is what you get", not a stock screenshot *
 * ------------------------------------------------------------------ */
type Lang = "de" | "en";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ *
 * Scenes shown inside the app window. Each returns the full body of *
 * the mock so the window frame never changes size between slides.   *
 * ------------------------------------------------------------------ */

function SceneOverview({ language }: { language: Lang }) {
  const bars = [38, 52, 44, 66, 58, 74, 62, 84, 71, 90];
  return (
    <>
      <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30">
        {language === "de" ? "Deine Finanzen heute" : "Your finances today"}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          { label: language === "de" ? "Einnahmen" : "Income", value: "1.200", tone: "text-[#b3ff83]", ring: "border-[#b3ff83]/20" },
          { label: language === "de" ? "Ausgaben" : "Spent", value: "800", tone: "text-white", ring: "border-white/10" },
          { label: language === "de" ? "Saldo" : "Balance", value: "400", tone: "text-white", ring: "border-white/10" },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border ${m.ring} bg-white/[0.035] p-2.5`}>
            <div className="truncate text-[7px] font-semibold uppercase tracking-[0.12em] text-white/30">
              {m.label}
            </div>
            <div className={`mt-1.5 text-[15px] font-medium tracking-[-0.04em] ${m.tone}`}>
              {m.value} <span className="text-[8px] text-white/30">EUR</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/28">
          {language === "de" ? "Cashflow-Verlauf" : "Cash flow"}
        </div>
        <div className="mt-3 flex h-[68px] items-end gap-[5px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className="sb-bar flex-1 rounded-t-[3px] bg-[#b3ff83]"
              style={{ height: `${h}%`, opacity: 0.28 + (i / bars.length) * 0.62, animationDelay: `${i * 45}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {[
          { n: language === "de" ? "Monatsgehalt" : "Monthly salary", v: "+1.200,00", up: true },
          { n: language === "de" ? "Miete" : "Rent", v: "−800,00", up: false },
        ].map((row) => (
          <div key={row.n} className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
            <span className={`size-5 shrink-0 rounded-md ${row.up ? "bg-[#b3ff83]/15" : "bg-[#ff8a8a]/12"}`} />
            <span className="min-w-0 flex-1 truncate text-[9px] text-white/60">{row.n}</span>
            <span className={`text-[9px] font-medium ${row.up ? "text-[#b3ff83]" : "text-white/45"}`}>{row.v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function SceneBudget({ language }: { language: Lang }) {
  const rows = [
    { n: language === "de" ? "Wohnen" : "Housing", spent: 800, total: 800, tone: "bg-[#ff8a8a]" },
    { n: language === "de" ? "Lebensmittel" : "Groceries", spent: 214, total: 400, tone: "bg-[#b3ff83]" },
    { n: language === "de" ? "Mobilität" : "Transport", spent: 96, total: 300, tone: "bg-[#8fb8ff]" },
  ];
  return (
    <>
      <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30">
        {language === "de" ? "Budget-Planung" : "Budget planning"}
      </div>

      <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[8px] text-white/35">{language === "de" ? "Ausgaben" : "Spent"}</span>
          <span className="text-[15px] font-medium tracking-[-0.04em]">
            1.110 <span className="text-[8px] text-white/30">/ 1.500 EUR</span>
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="sb-grow h-full rounded-full bg-[#b3ff83]" style={{ width: "74%" }} />
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {rows.map((row) => {
          const pct = Math.min(100, Math.round((row.spent / row.total) * 100));
          const over = pct >= 100;
          return (
            <div key={row.n} className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-white/60">{row.n}</span>
                <span className={over ? "text-[#ff8a8a]" : "text-white/45"}>
                  {row.spent} <span className="text-white/25">/ {row.total}</span>
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`sb-grow h-full rounded-full ${over ? "bg-[#ff8a8a]" : row.tone}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-[#b3ff83]/15 bg-[#b3ff83]/[0.05] px-2.5 py-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[#b3ff83] text-[#030303]">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[9px] text-white/60">
          {language === "de" ? "Wohnen ist vollständig gedeckt" : "Housing is fully covered"}
        </span>
      </div>
    </>
  );
}

function SceneAdvisor({ language }: { language: Lang }) {
  const rows = [
    { q: language === "de" ? "Wofür gibst du am meisten aus?" : "Where do you spend the most?", a: language === "de" ? "Wohnen ist mit 800 € dein größter Brocken — 72 % deiner Ausgaben." : "Housing is your biggest item at €800 — 72% of your spending." },
    { q: language === "de" ? "Kann ich 150 € sparen?" : "Could I save €150?", a: language === "de" ? "Ja. Nach Wohnen bleiben dir 400 €, davon sind 150 € frei." : "Yes. After housing you have €400 left, €150 of it uncommitted." },
  ];
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-[#b3ff83] text-[#030303]">
          <Sparkles className="size-2.5" />
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30">Copilot</span>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.q}>
            <div className="ml-auto w-fit max-w-[86%] rounded-lg rounded-br-sm bg-[#b3ff83] px-2.5 py-1.5">
              <p className="text-[9px] font-medium leading-[1.5] text-[#030303]">{r.q}</p>
            </div>
            <div className="mt-1.5 flex items-start gap-1.5">
              <span className="mt-px flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#b3ff83]/15">
                <Sparkles className="size-2 text-[#b3ff83]" />
              </span>
              <p className="text-[9px] leading-[1.5] text-white/55">{r.a}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2">
        <span className="min-w-0 flex-1 truncate text-[9px] text-white/28">
          {language === "de" ? "Frage stellen…" : "Ask anything…"}
        </span>
        <span className="flex size-4 shrink-0 items-center justify-center rounded-md bg-[#b3ff83] text-[#030303]">
          <ArrowUpRight className="size-2.5" />
        </span>
      </div>
    </>
  );
}

const SCENES = [
  { id: "overview", labelDe: "Übersicht", labelEn: "Overview", render: SceneOverview },
  { id: "budget", labelDe: "Budget", labelEn: "Budget", render: SceneBudget },
  { id: "advisor", labelDe: "Copilot", labelEn: "Copilot", render: SceneAdvisor },
];

const SCENE_MS = 4200;

function ShowcasePanel({ language }: { language: Lang }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  const go = useCallback((next: number) => {
    setIndex(((next % SCENES.length) + SCENES.length) % SCENES.length);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SCENES.length), SCENE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduced, index]);

  const active = SCENES[index];
  const Scene = active.render;

  return (
    <section className="relative hidden overflow-hidden bg-[#08080a] lg:block">
      {/* ambient light */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-[8%] size-[620px] rounded-full bg-[#b3ff83]/[0.13] blur-[130px]" />
        <div className="absolute -left-32 bottom-[6%] size-[560px] rounded-full bg-[#83b8ff]/[0.12] blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative flex h-full items-center justify-center px-12 py-16 xl:px-20">
        {/* floating brand tile, top right */}
        <div className="absolute right-10 top-16 flex size-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.06] shadow-[0_30px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl xl:right-14 xl:size-24">
          <BrandMark className="size-10 xl:size-12" />
        </div>

        {/* the app window */}
        <div className="my-14 w-full max-w-[520px] overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0d0d0f]/90 shadow-[0_50px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* title bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <div className="ml-3 flex items-center gap-2">
              <BrandMark className="size-5 rounded-[6px]" />
              <span className="text-[9px] font-semibold tracking-[-0.02em] text-white/55">SmartBudget</span>
            </div>
          </div>

          <div className="flex">
            {/* mini rail - first three tiles track the active scene */}
            <aside className="hidden w-12 shrink-0 flex-col gap-2 border-r border-white/[0.06] p-3 sm:flex">
              {SCENES.map((scene, i) => (
                <span
                  key={scene.id}
                  className={`h-6 rounded-lg transition-all duration-500 ${
                    i === index ? "bg-[#b3ff83]" : "bg-white/20"
                  }`}
                />
              ))}
              {["bg-white/20", "bg-white/20", "bg-white/20"].map((tone, i) => (
                <span key={i} className={`h-6 rounded-lg ${tone}`} />
              ))}
            </aside>

            {/* scene viewport - fixed height so the window never resizes */}
            <div
              className="relative min-w-0 flex-1 p-4"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* fixed height = tallest scene, so the window never resizes between slides */}
              <div className="relative h-[312px]">
                <div
                  key={active.id}
                  className="sb-scene absolute inset-0"
                  style={reduced ? undefined : { animationDelay: "0ms" }}
                >
                  <Scene language={language} />
                </div>
              </div>

              {/* scene switcher */}
              <div className="mt-3 flex items-center gap-1.5" role="tablist" aria-label={language === "de" ? "Ansichten" : "Views"}>
                {SCENES.map((scene, i) => {
                  const on = i === index;
                  return (
                    <button
                      key={scene.id}
                      role="tab"
                      aria-selected={on}
                      onClick={() => go(i)}
                      className="group flex items-center gap-1.5"
                    >
                      <span className="relative block h-[3px] overflow-hidden rounded-full bg-white/12" style={{ width: on ? 26 : 12, transition: "width 320ms cubic-bezier(.4,0,.2,1)" }}>
                        {on && !reduced && (
                          <span
                            className="sb-progress absolute inset-y-0 left-0 rounded-full bg-[#b3ff83]"
                            style={{ animationDuration: `${SCENE_MS}ms` }}
                          />
                        )}
                        {on && reduced && <span className="absolute inset-0 rounded-full bg-[#b3ff83]" />}
                      </span>
                      <span
                        className={`text-[8px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                          on ? "text-white/55" : "text-white/22 group-hover:text-white/40"
                        }`}
                      >
                        {language === "de" ? scene.labelDe : scene.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* floating balance card, bottom left */}
        <div className="absolute bottom-8 left-6 w-[228px] rounded-2xl border border-white/[0.1] bg-[#111113]/95 p-4 shadow-[0_34px_80px_rgba(0,0,0,0.62)] backdrop-blur-xl xl:bottom-12 xl:left-10">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {language === "de" ? "Saldo" : "Balance"}
            </span>
            <span className="flex size-6 items-center justify-center rounded-lg bg-[#b3ff83]/12 text-[#b3ff83]">
              <TrendingUp className="size-3" />
            </span>
          </div>
          <div className="mt-2.5 text-[26px] font-medium tracking-[-0.05em]">400,00 €</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-white/30">
            {language === "de" ? "im laufenden Monat" : "this month"}
            <span className="text-[#b3ff83]">+33%</span>
          </div>
          <svg viewBox="0 0 120 26" className="mt-3 h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 22 L14 19 L28 20 L42 13 L56 16 L70 9 L84 11 L98 5 L112 7 L120 2"
              fill="none"
              stroke="#b3ff83"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* floating advisor card, top left */}
        <div className="absolute left-6 top-24 w-[206px] rounded-2xl border border-white/[0.1] bg-[#111113]/95 p-4 shadow-[0_34px_80px_rgba(0,0,0,0.62)] backdrop-blur-xl xl:left-10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#b3ff83] text-[#030303]">
              <Sparkles className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold tracking-[-0.02em]">Copilot</div>
              <div className="truncate text-[8px] text-white/30">
                {language === "de" ? "Bereit für deine Frage" : "Ready for your question"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[9px] leading-[1.55] text-white/45">
            {language === "de"
              ? "„Wofür gibst du am meisten aus?“"
              : '"Where do you spend the most?"'}
          </p>
        </div>
      </div>
    </section>
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
    language === "de"
      ? "Alle Konten in einer ruhigen, klaren Ansicht"
      : "Every account in one calm, clear view",
    language === "de"
      ? "Budgets, Trends und Sparziele ohne Tabellenchaos"
      : "Budgets, trends, and goals without spreadsheet chaos",
    language === "de"
      ? "Ein KI-Berater, der deine nächsten Schritte erklärt"
      : "An AI advisor that explains your next best step",
  ];

  return (
    <main className="grid min-h-screen bg-[#030303] text-white lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------- form side ---------------- */}
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#030303]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-28 size-[480px] rounded-full bg-[#b3ff83]/[0.07] blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        <header className="relative flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <div className="text-[15px] font-semibold tracking-[-0.04em]">SmartBudget</div>
              <div className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Personal finance
              </div>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-1">
            {(["de", "en"] as const).map((locale) => (
              <button
                key={locale}
                onClick={() => useLanguageStore.setState({ language: locale })}
                className={`h-8 min-w-10 rounded-lg px-3 text-[10px] font-semibold transition ${
                  language === locale ? "bg-white text-[#030303]" : "text-white/38 hover:text-white/70"
                }`}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* form block, optically centred in the column */}
        <div className="relative flex flex-1 items-center px-6 pb-16 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[#b3ff83]/20 bg-[#b3ff83]/[0.08]">
              <LockKeyhole className="size-5 text-[#b3ff83]" />
            </div>

            <h1 className="mt-7 text-[clamp(30px,4vw,40px)] font-medium leading-[1.05] tracking-[-0.055em]">
              {language === "de" ? (
                <>
                  Willkommen zurück bei <span className="text-[#b3ff83]">SmartBudget</span>
                </>
              ) : (
                <>
                  Welcome back to <span className="text-[#b3ff83]">SmartBudget</span>
                </>
              )}
            </h1>

            <p className="mt-3.5 text-[13px] leading-6 text-white/42">
              {language === "de"
                ? "Melde dich an, um deine Ausgaben, Budgets und Sparziele wieder im Blick zu haben."
                : "Sign in to pick your spending, budgets, and savings goals back up."}
            </p>

            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="mt-9 flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-[12px] font-semibold text-[#181819] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(255,255,255,0.14)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="size-[17px] animate-spin rounded-full border-2 border-[#181819]/20 border-t-[#181819]" />
              ) : (
                <svg className="size-[17px]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {isLoading
                ? language === "de"
                  ? "Wird angemeldet…"
                  : "Signing you in…"
                : t.auth.signInWithGoogle}
            </button>

            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-white/[0.075]" />
              <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/25">
                {language === "de" ? "oder" : "or"}
              </span>
              <span className="h-px flex-1 bg-white/[0.075]" />
            </div>

            <div className="mt-8 space-y-3 border-t border-white/[0.06] pt-8">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 text-[11px] leading-5 text-white/45">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#b3ff83]/10 text-[#b3ff83]">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>

            <p className="mt-10 flex items-center justify-center gap-2 text-[9px] text-white/22">
              <LockKeyhole className="size-3" />
              {language === "de"
                ? "Sichere Anmeldung · Deine Daten bleiben privat"
                : "Secure sign-in · Your data stays private"}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- showcase side ---------------- */}
      <ShowcasePanel language={language} />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
          <span className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-[#b3ff83]" />
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
