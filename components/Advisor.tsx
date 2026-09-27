"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  FileText,
  History,
  Landmark,
  MessageSquare,
  Mic,
  Paperclip,
  Pencil,
  PiggyBank,
  Send,
  Sparkles,
  Square,
  SquarePen,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";

type Message = {
  from: "user" | "assistant";
  text: string;
  degraded?: boolean;
  files?: string[];
  actions?: AppliedAction[];
};
type AppliedAction = {
  action: string;
  label?: string;
  count?: number;
  failed?: boolean;
};
type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
};
type AssistantMode = "balanced" | "reasoning" | "research";
type Attachment = { id: string; name: string; size: number; text: string };
type AdvisorContext = {
  income: string;
  expenses: string;
  balance: string;
  savings: string;
  transactions: number;
};

const HISTORY_KEY = "smartbudget-ai-chat-history";
const MAX_FILE_BYTES = 200_000;
const MAX_FILE_CHARS = 3000;
const FILE_ACCEPT = ".csv,.tsv,.json,.txt,.md,.log,.xml,.yaml,.yml";
const MAX_ATTACHMENTS = 3;
const MAX_SESSIONS = 30;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; text: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "rule" };

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
      return <span key={key}>{part}</span>;
    });
}

function splitTableRow(line: string): string[] | null {
  if (!line.startsWith("|")) return null;
  const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|");
  return cells.map((cell) => cell.trim());
}

function isTableDivider(cells: string[]) {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

function parseBlocks(raw: string): Block[] {
  const lines = raw.split(/\r?\n/);
  const blocks: Block[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      blocks.push({ kind: "paragraph", text: "" });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ kind: "rule" });
      continue;
    }

    const head = splitTableRow(trimmed);
    if (head) {
      const rows: string[][] = [];
      let cursor = index + 1;
      if (cursor < lines.length) {
        const next = splitTableRow(lines[cursor].trim() || "");
        if (next && isTableDivider(next)) cursor += 1;
      }
      while (cursor < lines.length) {
        const row = splitTableRow(lines[cursor].trim() || "");
        if (!row) break;
        rows.push(row);
        cursor += 1;
      }
      index = cursor - 1;
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    const heading = /^#{1,4}\s+(.*)$/.exec(trimmed);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1] });
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      blocks.push({ kind: "bullet", text: trimmed.replace(/^[-*•]\s+/, "") });
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      blocks.push({ kind: "numbered", text: trimmed.replace(/^\d+[.)]\s+/, "") });
      continue;
    }

    blocks.push({ kind: "paragraph", text: trimmed });
  }

  return blocks;
}

function formatText(text: string): ReactNode[] {
  return parseBlocks(text).map((block, index) => {
    const key = `b${index}`;

    if (block.kind === "table") {
      return (
        <div key={key} className="ai-md-table">
          <div className="ai-md-row is-head">
            {block.head.map((cell, cellIndex) => (
              <span key={`${key}-h${cellIndex}`}>{renderInline(cell, `${key}-h${cellIndex}`)}</span>
            ))}
          </div>
          {block.rows.map((row, rowIndex) => (
            <div key={`${key}-r${rowIndex}`} className="ai-md-row">
              {row.map((cell, cellIndex) => (
                <span key={`${key}-r${rowIndex}c${cellIndex}`}>{renderInline(cell, `${key}-r${rowIndex}c${cellIndex}`)}</span>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (block.kind === "heading") {
      return <div key={key} className="ai-md-heading">{renderInline(block.text, key)}</div>;
    }

    if (block.kind === "bullet") {
      return <div key={key} className="ai-md-bullet"><i />{renderInline(block.text, key)}</div>;
    }

    if (block.kind === "numbered") {
      return <div key={key} className="ai-numbered-line">{renderInline(block.text, key)}</div>;
    }

    if (block.kind === "rule") {
      return <div key={key} className="ai-md-rule" />;
    }

    if (!block.text) return <div key={key} className="h-2" />;
    return <div key={key}>{renderInline(block.text, key)}</div>;
  });
}

type StoredChats = { sessions: ChatSession[]; activeId: string | null };

function readStore(): StoredChats {
  if (typeof window === "undefined") return { sessions: [], activeId: null };
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);
    if (!stored) return { sessions: [], activeId: null };
    const parsed = JSON.parse(stored);

    // legacy shape: a bare array of chats without an active id
    if (Array.isArray(parsed)) {
      const sessions: ChatSession[] = parsed
        .filter((chat) => chat && Array.isArray(chat.messages))
        .map((chat) => ({
          id: String(chat.id),
          title: String(chat.title || ""),
          createdAt: Number(chat.createdAt) || Date.now(),
          updatedAt: Number(chat.updatedAt) || Number(chat.createdAt) || Date.now(),
          messages: chat.messages,
        }));
      return { sessions, activeId: sessions[0]?.id ?? null };
    }

    const sessions = Array.isArray(parsed?.sessions) ? parsed.sessions : [];
    const activeId = typeof parsed?.activeId === "string" ? parsed.activeId : null;
    return { sessions, activeId };
  } catch {
    return { sessions: [], activeId: null };
  }
}

function newSession(title: string, messages: Message[] = []): ChatSession {
  const now = Date.now();
  return {
    id: `session-${now}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages,
  };
}

function sessionGroupLabel(timestamp: number, language: "de" | "en"): string {
  const now = new Date();
  const date = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;

  if (timestamp >= startOfToday) return language === "de" ? "Heute" : "Today";
  if (timestamp >= startOfToday - dayMs) return language === "de" ? "Gestern" : "Yesterday";
  if (timestamp >= startOfToday - 7 * dayMs) return language === "de" ? "Diese Woche" : "This week";
  if (timestamp >= startOfToday - 30 * dayMs) return language === "de" ? "Letzter Monat" : "Last month";
  return language === "de" ? "Früher" : "Earlier";
}

function sessionTime(timestamp: number, language: "de" | "en"): string {
  const now = new Date();
  const date = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startOfToday) {
    return date.toLocaleTimeString(language === "de" ? "de-DE" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", { day: "2-digit", month: "short" });
}

/**
 * Shared session store. The full-page advisor and the compact popover are two
 * instances of this component mounted at the same time, so they must not each
 * keep their own copy of the list and write it back to the same storage key.
 */
const serverChatStore: StoredChats = { sessions: [], activeId: null };
const chatStoreListeners = new Set<() => void>();
let chatStoreCache: StoredChats | null = null;

function getChatStore(): StoredChats {
  if (!chatStoreCache) chatStoreCache = readStore();
  return chatStoreCache;
}

function subscribeChatStore(listener: () => void) {
  chatStoreListeners.add(listener);
  return () => {
    chatStoreListeners.delete(listener);
  };
}

function commitChatStore(update: (current: StoredChats) => StoredChats) {
  const next = update(getChatStore());
  chatStoreCache = next;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify({ sessions: next.sessions.slice(0, MAX_SESSIONS), activeId: next.activeId } satisfies StoredChats)
      );
    }
  } catch {
    // storage full or unavailable - sessions still work in memory
  }
  chatStoreListeners.forEach((listener) => listener());
}

export default function Advisor({
  compact = false,
  onClose,
  onExpand,
  focus = false,
  context,
}: {
  compact?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
  focus?: boolean;
  context?: AdvisorContext;
}) {
  const language = useLanguageStore((state) => state.language);
  const t = translations[language];
  const { user } = useAuth();
  const { sessions, activeId } = useSyncExternalStore(subscribeChatStore, getChatStore, () => serverChatStore);
  const messages = useMemo(
    () => sessions.find((session) => session.id === activeId)?.messages ?? [],
    [sessions, activeId]
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AssistantMode>("balanced");
  const [panelOpen, setPanelOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [listening, setListening] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    setSpeechReady(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (sessions.length > 0) return;
    commitChatStore(() => {
      const created = newSession(language === "de" ? "Neue Unterhaltung" : "New conversation");
      return { sessions: [created], activeId: created.id };
    });
  }, [sessions.length, language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/money-tips?language=${language}`);
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !Array.isArray(data.recommendations)) return;
        setSuggestions(
          data.recommendations
            .slice(0, 3)
            .map((recommendation: any) => recommendation.title || recommendation.description)
            .filter(Boolean)
        );
      } catch {
        // Suggestions are optional.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    function onPlan(event: Event) {
      const customEvent = event as CustomEvent<string[]>;
      if (!Array.isArray(customEvent.detail)) return;
      const steps = customEvent.detail;
      appendToActiveSession((current) => [
        ...current,
        { from: "assistant", text: steps.map((step, index) => `${index + 1}. ${step.replace(/^\d+\.\s*/, "")}`).join("\n") },
      ]);
    }
    window.addEventListener("ai:plan", onPlan);
    return () => window.removeEventListener("ai:plan", onPlan);
  });

  useEffect(() => {
    function onQuickPrompt(event: Event) {
      const prompt = String((event as CustomEvent<{ prompt?: string }>).detail?.prompt || "").trim();
      if (!prompt) return;
      setInput(prompt);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
    window.addEventListener("ai:quickPrompt", onQuickPrompt);
    return () => window.removeEventListener("ai:quickPrompt", onQuickPrompt);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [focus]);

  useEffect(() => {
    if (messages.length === 0) {
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
      return;
    }
    const timer = setTimeout(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }, 60);
    return () => clearTimeout(timer);
  }, [messages.length, loading]);

  const firstName = user?.displayName?.split(" ")[0] || (language === "de" ? "deine Finanzen" : "your finances");
  const greeting = language === "de"
    ? `Was möchtest du über ${firstName} verstehen?`
    : `What would you like to understand about ${firstName}?`;

  // capability line: says what it can reach, not "how can I help"
  const capability = compact
    ? (language === "de"
        ? "Ich sehe deine Buchungen, Budgets, Sparziele und kann Einträge für dich anlegen."
        : "I can see your transactions, budgets and goals - and log entries for you.")
    : (language === "de"
        ? "Ich sehe deine Buchungen, Budgets, Sparziele und wiederkehrenden Zahlungen. Ich kann Einträge anlegen, löschen und Budgets setzen."
        : "I can see your transactions, budgets, goals and recurring payments. I can create and delete entries and set budgets.");

  // quick replies are written the way a person would ask, not as feature names
  const promptCards = language === "de"
    ? [
        { icon: BarChart3, short: "Ausgaben", question: "Wo fließt mein Geld hin?", prompt: "Analysiere meine Ausgaben und finde die drei größten Einsparpotenziale." },
        { icon: PiggyBank, short: "Sparplan", question: "Wie spare ich 300 € pro Monat?", prompt: "Erstelle einen konkreten Sparplan, mit dem ich 300 Euro pro Monat spare." },
        { icon: WalletCards, short: "Budget", question: "Reicht mein Budget noch?", prompt: "Prüfe mein Budget und zeige mir Engpässe und Warnschwellen." },
        { icon: Landmark, short: "Netto", question: "Wie viel bleibt mir netto?", prompt: "Erkläre mir meine Brutto-Netto-Differenz und die wichtigsten Abzüge." },
      ]
    : [
        { icon: BarChart3, short: "Spending", question: "Where is my money going?", prompt: "Analyze my spending and find my three biggest saving opportunities." },
        { icon: PiggyBank, short: "Savings", question: "How do I save 300 a month?", prompt: "Create a concrete savings plan for saving 300 a month." },
        { icon: WalletCards, short: "Budget", question: "Is my budget still on track?", prompt: "Review my budget and show me warnings or pressure points." },
        { icon: Landmark, short: "Net pay", question: "How much do I actually keep?", prompt: "Explain my gross-to-net difference and the most important deductions." },
      ];
  const modeLabels: Record<AssistantMode, string> = language === "de"
    ? { balanced: "Direkt", reasoning: "Denkmodus", research: "Research" }
    : { balanced: "Direct", reasoning: "Reasoning", research: "Research" };
  const contextMetrics = context
    ? [
        { label: language === "de" ? "Einnahmen" : "Income", value: context.income, tone: "income" },
        { label: language === "de" ? "Ausgaben" : "Expenses", value: context.expenses, tone: "expense" },
        { label: language === "de" ? "Saldo" : "Balance", value: context.balance, tone: "balance" },
        { label: language === "de" ? "Sparquote" : "Saved", value: context.savings, tone: "savings" },
      ]
    : [];
  const connectedSources = language === "de"
    ? ["Buchungen", "Budgets", "Sparziele", "Wiederkehrende Zahlungen"]
    : ["Transactions", "Budgets", "Savings goals", "Recurring payments"];

  const groupedSessions = useMemo(() => {
    const groups = new Map<string, ChatSession[]>();
    for (const session of [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)) {
      const label = sessionGroupLabel(session.updatedAt, language);
      const bucket = groups.get(label);
      if (bucket) bucket.push(session);
      else groups.set(label, [session]);
    }
    return [...groups.entries()];
  }, [sessions, language]);

  const startNewSession = () => {
    const created = newSession(language === "de" ? "Neue Unterhaltung" : "New conversation");
    commitChatStore((current) => ({
      sessions: [created, ...current.sessions].slice(0, MAX_SESSIONS),
      activeId: created.id,
    }));
    setInput("");
    setAttachments([]);
    setRenamingId(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const openSession = (session: ChatSession) => {
    commitChatStore((current) => ({ ...current, activeId: session.id }));
    setRenamingId(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const deleteSession = (id: string) => {
    commitChatStore((current) => {
      const remaining = current.sessions.filter((session) => session.id !== id).slice(0, MAX_SESSIONS);
      if (remaining.length === 0) {
        const created = newSession(language === "de" ? "Neue Unterhaltung" : "New conversation");
        return { sessions: [created], activeId: created.id };
      }
      return {
        sessions: remaining,
        activeId: current.activeId === id ? remaining[0].id : current.activeId,
      };
    });
    setRenamingId(null);
  };

  const renameSession = (id: string, title: string) => {
    const clean = title.trim().slice(0, 60);
    if (!clean) return;
    commitChatStore((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id === id ? { ...session, title: clean } : session
      ),
    }));
    setRenamingId(null);
  };

  const clearAllSessions = () => {
    const created = newSession(language === "de" ? "Neue Unterhaltung" : "New conversation");
    commitChatStore(() => ({ sessions: [created], activeId: created.id }));
    setRenamingId(null);
  };

  // always appends to the store's current copy, never to a captured array,
  // so a late response can never overwrite messages added in the meantime
  const appendToActiveSession = (add: Message | ((current: Message[]) => Message[])) => {
    commitChatStore((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== current.activeId) return session;
        const next = typeof add === "function" ? add(session.messages) : [...session.messages, add];
        return { ...session, messages: next, updatedAt: Date.now() };
      }),
    }));
  };

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const accepted: Attachment[] = [];

    for (const file of files) {
      if (accepted.length >= MAX_ATTACHMENTS) break;
      if (file.size > MAX_FILE_BYTES) {
        setNotice(
          language === "de"
            ? `${file.name} ist zu groß (max. 200 KB)`
            : `${file.name} is too large (max 200 KB)`
        );
        continue;
      }
      try {
        const raw = await file.text();
        accepted.push({
          id: `${file.name}-${file.size}-${accepted.length}-${file.lastModified}`,
          name: file.name,
          size: file.size,
          text: raw.slice(0, MAX_FILE_CHARS),
        });
      } catch {
        setNotice(
          language === "de" ? `${file.name} konnte nicht gelesen werden` : `${file.name} could not be read`
        );
      }
    }

    if (accepted.length > 0) {
      setAttachments((current) => [...current, ...accepted].slice(0, MAX_ATTACHMENTS));
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }

  function toggleListening() {
    if (listening) {
      stopListening();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = language === "de" ? "de-DE" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setInput((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setListening(false);
      if (event?.error === "not-allowed") {
        setNotice(language === "de" ? "Mikrofonzugriff verweigert" : "Microphone access was denied");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stopGenerating() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }

  // the first user message names the session, unless it was renamed by hand
  function ensureSessionTitle(text: string) {
    if (!activeId) return;
    const clean = text.replace(/[*#`]/g, "").replace(/\s+/g, " ").trim().slice(0, 48);
    if (!clean) return;
    const fallback = language === "de" ? "Neue Unterhaltung" : "New conversation";
    commitChatStore((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== current.activeId) return session;
        const stillPlaceholder =
          session.title === fallback || !session.messages.some((message) => message.from === "user");
        return stillPlaceholder ? { ...session, title: clean } : session;
      }),
    }));
  }

  async function send(messageOverride?: string) {
    const value = (messageOverride ?? input).trim();
    const pending = messageOverride ? [] : attachments;
    if ((!value && pending.length === 0) || loading) return;

    if (listening) stopListening();

    const userMessage: Message = {
      from: "user",
      text: value || (language === "de" ? "Datei analysieren" : "Analyse this file"),
      files: pending.length > 0 ? pending.map((item) => item.name) : undefined,
    };
    ensureSessionTitle(userMessage.text);
    appendToActiveSession((current) => [...current, userMessage]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          mode,
          attachments: pending.map((item) => ({ name: item.name, text: item.text })),
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Server returned ${response.status}`);

      const text = String(data?.reply || "").trim() || "I could not generate a response. Please try again.";
      const applied: AppliedAction[] = Array.isArray(data?.actions) ? data.actions : [];
      const assistantMessage: Message = {
        from: "assistant",
        text,
        degraded: Boolean(data?.degraded),
        actions: applied.length > 0 ? applied : undefined,
      };
      appendToActiveSession(assistantMessage);
      if (applied.length > 0) {
        window.dispatchEvent(new CustomEvent("ai:actions", { detail: applied }));
      }
      window.dispatchEvent(new CustomEvent("ai:message", { detail: { text } }));

      const salaryMatch = text.match(/(?:set|update|change) salary to\s*(\d+(?:\.\d+)?)/i);
      if (salaryMatch) {
        window.dispatchEvent(new CustomEvent("ai:setSalary", { detail: Number(salaryMatch[1]) }));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        appendToActiveSession({
          from: "assistant",
          text: language === "de" ? "Antwort abgebrochen." : "Response stopped.",
        });
        return;
      }
      const message = error instanceof Error ? error.message : "Something went wrong.";
      const assistantMessage: Message = { from: "assistant", text: `Assistant error: ${message}` };
      appendToActiveSession(assistantMessage);
      window.dispatchEvent(new CustomEvent("ai:message", { detail: { text: assistantMessage.text } }));
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div ref={containerRef} className={`ai-chat${compact ? " is-compact" : ""}`}>
      <header className="ai-toolbar">
        <div className="ai-toolbar-brand">
          <span className="ai-mark"><Sparkles className="size-4" /></span>
          <div>
            <div className="ai-toolbar-title">Copilot</div>
            <div className="ai-online">
              <i />
              {language === "de"
                ? `Verbunden · ${context?.transactions ?? 0} ${context?.transactions === 1 ? "Buchung" : "Buchungen"}`
                : `Connected · ${context?.transactions ?? 0} ${context?.transactions === 1 ? "transaction" : "transactions"}`}
            </div>
          </div>
        </div>

        <div className="ai-toolbar-actions">
          {compact && onExpand && (
            <button
              className="ai-tool"
              onClick={onExpand}
              title={language === "de" ? "Groß öffnen" : "Open full view"}
              aria-label={language === "de" ? "Groß öffnen" : "Open full view"}
            >
              <ArrowUpRight className="size-4" />
            </button>
          )}
          <div className="ai-modes" role="group" aria-label={language === "de" ? "Antwortmodus" : "Answer mode"}>
            {(["balanced", "reasoning", "research"] as AssistantMode[]).map((option) => (
              <button
                key={option}
                className={mode === option ? "is-active" : ""}
                onClick={() => setMode(option)}
                title={modeLabels[option]}
              >
                {modeLabels[option]}
              </button>
            ))}
          </div>
          {!compact && (
            <button
              className={`ai-tool${panelOpen ? " is-active" : ""}`}
              onClick={() => setPanelOpen((open) => !open)}
              title={language === "de" ? "Kontext und Unterhaltungen" : "Context and sessions"}
            >
              <History className="size-4" />
              {sessions.length > 1 && <span className="ai-tool-count">{sessions.length}</span>}
            </button>
          )}
          {!compact && (
            <button className="ai-tool" onClick={startNewSession} title={language === "de" ? "Neue Unterhaltung" : "New session"}>
              <SquarePen className="size-4" />
            </button>
          )}
          {compact && onClose && (
            <button className="ai-tool" onClick={onClose} aria-label={language === "de" ? "Schließen" : "Close"}>
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      <section className="ai-stage">
        <div className="ai-column">
          {context && !compact && (
            <div className="ai-context-line">
              {contextMetrics.map((metric) => (
                <span key={metric.label} className={`is-${metric.tone}`}>
                  <i />{metric.label}
                  <strong>{metric.value}</strong>
                </span>
              ))}
            </div>
          )}

          <div ref={scrollerRef} className="ai-messages">
            {messages.length === 0 ? (
              <div className="ai-empty">
                {compact ? (
                  <>
                    <p className="ai-capability">{capability}</p>
                    <div className="ai-starters is-questions">
                      <div className="ai-starters-label">
                        {language === "de" ? "Starte mit einer Frage" : "Start with a question"}
                      </div>
                      {promptCards.map((prompt) => {
                        const Icon = prompt.icon;
                        return (
                          <button key={prompt.question} onClick={() => void send(prompt.prompt)}>
                            <Icon className="size-3.5" />
                            {prompt.question}
                            <ChevronRight className="size-3.5 ai-starter-arrow" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ai-empty-mark"><Sparkles className="size-5" /></div>
                    <span className="ai-empty-eyebrow">SmartBudget Copilot</span>
                    <h2>{greeting}</h2>
                    <p>{capability}</p>
                    <div className="ai-starters">
                      {promptCards.map((prompt) => {
                        const Icon = prompt.icon;
                        return (
                          <button key={prompt.short} onClick={() => void send(prompt.prompt)}>
                            <Icon className="size-3.5" />
                            {prompt.short}
                            <ChevronRight className="size-3.5 ai-starter-arrow" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="ai-message-list">
                {messages.map((message, index) => {
                  const user = message.from === "user";
                  return (
                    <div key={`${message.from}-${index}`} className={`ai-message-row${user ? " is-user" : ""}`}>
                      {!user && <span className="ai-message-orb"><Sparkles className="size-3" /></span>}
                      <div className="ai-message-content">
                        <div className="ai-message-meta">
                          <span>{user ? (language === "de" ? "Du" : "You") : "Copilot"}</span>
                          {message.degraded && <i>{language === "de" ? "Lokaler Einzelfall" : "Local fallback"}</i>}
                        </div>
                        {message.files && message.files.length > 0 && (
                          <div className="ai-message-files">
                            {message.files.map((name) => (
                              <span key={name}><FileText className="size-3" />{name}</span>
                            ))}
                          </div>
                        )}
                        {message.actions && message.actions.length > 0 && (
                          <div className="ai-applied">
                            {message.actions.map((action, actionIndex) => (
                              <div key={`${action.action}-${actionIndex}`} className={action.failed ? "is-failed" : ""}>
                                {action.failed ? <AlertTriangle className="size-3" /> : <Check className="size-3" />}
                                <span>{action.label || action.action}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="ai-bubble">{formatText(message.text)}</div>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="ai-message-row">
                    <span className="ai-message-orb"><Sparkles className="size-3" /></span>
                    <div className="ai-thinking"><i /><i /><i /></div>
                  </div>
                )}
                {!loading && suggestions.length > 0 && (
                  <div className="ai-followups">
                    <span className="ai-followups-label">
                      {language === "de" ? "Weiter fragen" : "Ask next"}
                    </span>
                    <div className="ai-followups-row">
                      {suggestions.slice(0, compact ? 2 : 3).map((suggestion) => (
                        <button key={suggestion} onClick={() => void send(suggestion)}>{suggestion}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ai-composer">
            {attachments.length > 0 && (
              <div className="ai-attachments">
                {attachments.map((attachment) => (
                  <span key={attachment.id}>
                    <FileText className="size-3" />
                    <em>{attachment.name}</em>
                    <small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small>
                    <button onClick={() => removeAttachment(attachment.id)} aria-label={`${language === "de" ? "Entfernen" : "Remove"} ${attachment.name}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening
                ? language === "de" ? "Ich höre zu …" : "Listening …"
                : language === "de" ? "Frage nach deinen Finanzen …" : "Ask anything about your money …"}
              rows={compact ? 1 : 2}
              disabled={loading}
            />

            <div className="ai-composer-actions">
              <div className="ai-composer-left">
                <button
                  title={language === "de" ? "Datei anhängen (CSV, JSON, TXT, MD)" : "Attach file (CSV, JSON, TXT, MD)"}
                  aria-label={language === "de" ? "Datei anhängen" : "Attach file"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_ACCEPT}
                  multiple
                  className="ai-file-input"
                  onChange={(event) => {
                    void handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <span className="ai-composer-hint">
                  {attachments.length > 0
                    ? `${attachments.length}/${MAX_ATTACHMENTS} ${language === "de" ? "Dateien" : "files"}`
                    : language === "de" ? "Enter zum Senden · Shift+Enter für neue Zeile" : "Enter to send · Shift+Enter for a new line"}
                </span>
              </div>
              <div className="ai-composer-right">
                {speechReady && (
                  <button
                    className={listening ? "is-listening" : ""}
                    onClick={toggleListening}
                    title={listening
                      ? language === "de" ? "Aufnahme stoppen" : "Stop listening"
                      : language === "de" ? "Mit Spracheingabe" : "Dictate with your voice"}
                    aria-label={language === "de" ? "Spracheingabe" : "Voice input"}
                  >
                    <Mic className="size-4" />
                    {listening && <span className="ai-mic-dot" />}
                  </button>
                )}
                {loading ? (
                  <button className="ai-send is-stop" onClick={stopGenerating} aria-label={language === "de" ? "Stoppen" : "Stop"}>
                    <Square className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button className="ai-send" onClick={() => void send()} disabled={!input.trim() && attachments.length === 0} aria-label={t.advisor?.send || "Send"}>
                    <Send className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {notice && <div className="ai-notice">{notice}</div>}
          </div>
        </div>

        {!compact && panelOpen && (
          <>
            <button className="ai-panel-scrim" onClick={() => setPanelOpen(false)} aria-label={language === "de" ? "Schließen" : "Close"} />
            <aside className="ai-panel">
              <div className="ai-panel-head">
                <div>
                  <strong>{language === "de" ? "Kontext" : "Context"}</strong>
                  <span>{language === "de" ? "Live aus SmartBudget" : "Live from SmartBudget"}</span>
                </div>
                <button onClick={() => setPanelOpen(false)} aria-label={language === "de" ? "Schließen" : "Close"}><X className="size-3.5" /></button>
              </div>

              {contextMetrics.length > 0 && (
                <div className="ai-panel-metrics">
                  {contextMetrics.map((metric) => (
                    <div key={metric.label} className={`is-${metric.tone}`}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="ai-panel-sources">
                {connectedSources.map((source) => (
                  <span key={source}><i />{source}</span>
                ))}
              </div>

              <div className="ai-panel-history-head">
                <span>{language === "de" ? "Unterhaltungen" : "Sessions"}</span>
                {sessions.length > 1 && (
                  <button onClick={clearAllSessions}>{language === "de" ? "Alle löschen" : "Clear all"}</button>
                )}
              </div>

              <button className="ai-panel-new" onClick={startNewSession}>
                <SquarePen className="size-3.5" />
                {language === "de" ? "Neue Unterhaltung" : "New session"}
              </button>

              <div className="ai-panel-list">
                {groupedSessions.map(([group, groupSessions]) => (
                  <div key={group} className="ai-history-group">
                    <div className="ai-history-label">{group}</div>
                    {groupSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`ai-session${session.id === activeId ? " is-active" : ""}`}
                      >
                        {renamingId === session.id ? (
                          <input
                            className="ai-session-rename"
                            defaultValue={session.title}
                            autoFocus
                            maxLength={60}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") renameSession(session.id, (event.target as HTMLInputElement).value);
                              if (event.key === "Escape") setRenamingId(null);
                            }}
                            onBlur={(event) => renameSession(session.id, event.target.value)}
                          />
                        ) : (
                          <button className="ai-session-open" onClick={() => openSession(session)}>
                            <MessageSquare className="size-3.5" />
                            <span>
                              <em>{session.title}</em>
                              <small>
                                {session.messages.length} {language === "de" ? "Nachrichten" : "messages"}
                                {" · "}
                                {sessionTime(session.updatedAt, language)}
                              </small>
                            </span>
                          </button>
                        )}
                        <div className="ai-session-tools">
                          <button
                            onClick={() => setRenamingId(session.id)}
                            title={language === "de" ? "Umbenennen" : "Rename"}
                            aria-label={language === "de" ? "Umbenennen" : "Rename"}
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            onClick={() => deleteSession(session.id)}
                            title={language === "de" ? "Löschen" : "Delete"}
                            aria-label={language === "de" ? "Löschen" : "Delete"}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}
      </section>
    </div>
  );
}
