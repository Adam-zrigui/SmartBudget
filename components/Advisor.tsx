import { useState, useEffect, useRef } from "react";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

interface Message {
  from: "user" | "assistant";
  text: string;
}

export default function Advisor({ compact, onClose, focus }: { compact?: boolean; onClose?: () => void; focus?: boolean }) {
  const language = useLanguageStore((s) => s.language);
  const t = translations[language];

  const [messages, setMessages] = useState<Message[]>([]);
  const [planSteps, setPlanSteps] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // fetch initial money-saving tips when component mounts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/money-tips?language=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.recommendations) {
            const text = data.recommendations
              .map((r: any) => `• ${r.title}: ${r.description}`)
              .join("\n");
            setMessages([{ from: "assistant", text }]);
          }
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [language]);

  // listen for plan events from backend parsing
  useEffect(() => {
    function onPlan(e: any) {
      const steps: string[] = e.detail;
      setPlanSteps(steps);
    }
    window.addEventListener('ai:plan', onPlan as EventListener);
    return () => window.removeEventListener('ai:plan', onPlan as EventListener);
  }, []);

  // focus input when requested (e.g., popover opened)
  useEffect(() => {
    if (focus) {
      setTimeout(() => {
        const el = containerRef.current?.querySelector('input') as HTMLInputElement | null;
        el?.focus();
      }, 80);
    }
  }, [focus]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { from: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      if (!res.ok) {
        // try to surface error details
        let errBody = null;
        try { errBody = await res.json(); } catch (e) { errBody = await res.text().catch(() => null); }
        const errMsg = (errBody && (errBody.error || JSON.stringify(errBody))) || `Server returned ${res.status}`;
        console.error("AI assistant route error:", errMsg);
        setMessages((m) => [...m, { from: "assistant", text: `Assistant error: ${errMsg}` }]);
        window.dispatchEvent(new CustomEvent('ai:message', { detail: { text: `Assistant error: ${errMsg}` } }));
        return;
      }
      const data = await res.json();
      const text = data?.reply && String(data.reply).trim() ? String(data.reply) : "Assistant did not return a response. Please try again.";
      const reply: Message = { from: "assistant", text };
      setMessages((m) => [...m, reply]);
      // notify for unread badge / external listeners
      window.dispatchEvent(new CustomEvent('ai:message', { detail: { text } }));
      // look for salary commands like "set salary to 3000"
      const match = text.match(/(?:set|update|change) salary to\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          window.dispatchEvent(new CustomEvent('ai:setSalary', { detail: value }));
        }
      }
      // look for a numbered plan and fire event
      const steps = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((l) => /^[0-9]+\./.test(l));
      if (steps.length > 0) {
        window.dispatchEvent(new CustomEvent('ai:plan', { detail: steps }));
      }
    } catch (err) {
      console.error("AI error", err);
      const msg = err?.message || String(err) || "Sorry, something went wrong.";
      setMessages((m) => [...m, { from: "assistant", text: `Assistant error: ${msg}` }]);
      window.dispatchEvent(new CustomEvent('ai:message', { detail: { text: `Assistant error: ${msg}` } }));
    } finally {
      setLoading(false);
    }
  }

  // auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      if (scrollerRef.current) {
        scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
      }
    }, 50);
  }, [messages.length, planSteps.length]);

  // compact mode uses a tighter layout suitable for a popup
  const containerClasses = compact ? 'w-80' : 'flex-1';

  return (
    <div className={containerClasses}>
      <Card className={compact ? 'shadow-lg' : ''}>
        {compact ? (
          <CardHeader className="flex items-center justify-between p-2">
            <div className="text-sm font-medium">{t.advisor?.welcome}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onClose && onClose()} aria-label="Close chat">✕</Button>
            </div>
          </CardHeader>
        ) : null}

          <CardContent ref={containerRef} className="p-4 flex flex-col h-80">
            <div ref={scrollerRef}>
                {planSteps.length > 0 && (
          <div className="bg-base-200 p-3 rounded-lg space-y-1">
            <div className="font-semibold">Savings Plan:</div>
            <ul className="list-decimal list-inside text-sm">
              {planSteps.map((s, i) => (
                <li key={i}>{s.replace(/^[0-9]+\./, '').trim()}</li>
              ))}
            </ul>
          </div>
        )}
                {messages.length === 0 && (
                  <div className="text-center text-sm opacity-50">
                    {t.advisor?.welcome}
                  </div>
                )}
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.from === 'assistant' && (
                      <div className="mr-2">
                        <Avatar>
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3 rounded-lg ${m.from === 'user' ? 'bg-primary/10' : 'bg-base-200'}`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                  <Input
                    className="flex-1 bg-transparent px-3 py-2 rounded-full"
                    type="text"
                    placeholder={t.advisor?.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    disabled={loading}
                  />
                  <Button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    variant="default"
                    size="icon"
                    aria-label={t.advisor?.send}
                    className="ml-1"
                  >
                    {loading ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
}
