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

// Enhanced markdown rendering with visual styling for numbers, links, and formatting
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Process bold text (**text**), numbers, percentages, and currency
  const regex = /\*\*([^\*]+)\*\*|(\$[\d,]+(?:\.\d{2})?)|(\d+(?:\.\d+)?%)|(\b(?:important|critical|note|tip|warning|success|excellent|good|low|deficit)\b)/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matched = match[0];
    
    if (match[1]) {
      // Bold text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-base-content">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      // Currency ($value)
      parts.push(
        <span key={`currency-${match.index}`} className="font-bold text-success bg-success/10 px-1.5 py-0.5 rounded inline-block">
          {matched}
        </span>
      );
    } else if (match[3]) {
      // Percentage (number%)
      const num = parseFloat(match[3]);
      const isGood = num >= 20;
      parts.push(
        <span 
          key={`percent-${match.index}`} 
          className={`font-bold px-1.5 py-0.5 rounded inline-block ${
            isGood 
              ? 'text-success bg-success/10' 
              : num >= 10 
                ? 'text-info bg-info/10'
                : 'text-warning bg-warning/10'
          }`}
        >
          {matched}
        </span>
      );
    } else if (match[4]) {
      // Keywords (important, tip, warning, etc.)
      const keyword = matched.toLowerCase();
      const styleMap: { [key: string]: string } = {
        'important': 'text-error bg-error/10',
        'critical': 'text-error bg-error/10',
        'warning': 'text-warning bg-warning/10',
        'note': 'text-info bg-info/10',
        'tip': 'text-info bg-info/10',
        'success': 'text-success bg-success/10',
        'excellent': 'text-success bg-success/10',
        'good': 'text-success bg-success/10',
        'low': 'text-warning bg-warning/10',
        'deficit': 'text-error bg-error/10',
      };
      
      parts.push(
        <span 
          key={`keyword-${match.index}`} 
          className={`font-semibold px-1.5 py-0.5 rounded inline-block ${styleMap[keyword] || 'text-primary bg-primary/10'}`}
        >
          {matched}
        </span>
      );
    }

    lastIndex = match.index + matched.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
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

  // Receive quick prompts from dashboard CTA buttons.
  useEffect(() => {
    function onQuickPrompt(e: any) {
      const prompt = String(e?.detail?.prompt || '').trim();
      if (!prompt) return;
      setInput(prompt);
      setTimeout(() => {
        const el = containerRef.current?.querySelector('input') as HTMLInputElement | null;
        el?.focus();
      }, 80);
    }
    window.addEventListener('ai:quickPrompt', onQuickPrompt as EventListener);
    return () => window.removeEventListener('ai:quickPrompt', onQuickPrompt as EventListener);
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
    
    console.log("Sending message to API:", {
      messageText: userMsg.text,
      messageLength: userMsg.text.length,
      payload: { message: userMsg.text }
    });
    
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
      const msg = (err as Error)?.message || String(err) || "Sorry, something went wrong.";
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
  const containerClasses = compact ? 'w-full max-w-80 sm:max-w-96' : 'flex-1';

  return (
    <div className={containerClasses}>
      <Card className={compact ? 'shadow-lg hover:shadow-xl transition-shadow duration-300' : ''}>
        {compact ? (
          <CardHeader className="flex items-center justify-between p-2 bg-gradient-to-r from-base-200/50 to-base-300/50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="text-sm font-medium">{t.advisor?.welcome}</div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onClose && onClose()} 
                aria-label="Close chat"
                className="transition-all duration-300 hover:bg-red-500/20 hover:text-red-600"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
        ) : null}

          <CardContent ref={containerRef} className={`p-4 flex flex-col ${compact ? 'max-h-[calc(100vh-200px)]' : 'h-80'}`}>
            <div ref={scrollerRef} className={compact ? 'overflow-y-auto flex-1 pr-2' : ''}>

                {planSteps.length > 0 && (
          <div className="bg-base-200 p-3 rounded-lg space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-3">
            <div className="font-semibold">Savings Plan:</div>
            <ul className="list-decimal list-inside text-sm">
              {planSteps.map((s, i) => (
                <li key={i} className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  {s.replace(/^[0-9]+\./, '').trim()}
                </li>
              ))}
            </ul>
          </div>
        )}
                {messages.length === 0 && (
                  <div className="text-center text-sm opacity-50 animate-in fade-in duration-700">
                    {t.advisor?.welcome}
                  </div>
                )}
                {messages.map((m, idx) => {
                  // Detect message type based on content
                  const hasNumbers = /\d+(?:\.\d+)?%|€|\$|£/.test(m.text);
                  const hasWarning = /warning|critical|important/i.test(m.text);
                  const hasTip = /tip|note|suggestion|recommend/i.test(m.text);
                  const isUser = m.from === 'user';
                  
                  // Icon and label mapping for accessibility
                  const getMessageIconInfo = () => {
                    if (isUser) return { emoji: null, label: null };
                    if (hasWarning) return { emoji: '⚠️', label: 'Warning message' };
                    if (hasTip) return { emoji: '💡', label: 'Helpful tip' };
                    if (hasNumbers) return { emoji: '📊', label: 'Contains financial information' };
                    return { emoji: '💬', label: 'AI response' };
                  };
                  
                  const { emoji: messageEmoji, label: messageLabel } = getMessageIconInfo();

                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 animate-in fade-in duration-400 group`} style={{ animationDelay: `${idx * 50}ms` }}>
                      {!isUser && (
                        <div className="mr-2 animate-in fade-in zoom-in duration-300">
                          <Avatar className="ring-2 ring-base-300/50 group-hover:ring-base-300 transition-all duration-300">
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] p-3 rounded-lg transform transition-all duration-300 group-hover:scale-105 ${
                          isUser 
                            ? 'bg-gradient-to-br from-primary/15 to-primary/10 hover:from-primary/20 hover:to-primary/15 shadow-sm hover:shadow-md text-base-content rounded-br-none' 
                            : `bg-gradient-to-br from-base-200/80 to-base-300/50 hover:from-base-200 hover:to-base-300 shadow-sm hover:shadow-md rounded-bl-none ${
                              hasWarning ? 'border-l-4 border-warning/50' :
                              hasTip ? 'border-l-4 border-info/50' :
                              hasNumbers ? 'border-l-4 border-success/50' : ''
                            }`
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!isUser && messageEmoji && (
                            <span 
                              className="text-lg mt-0.5 flex-shrink-0 animate-in zoom-in duration-300" 
                              style={{ animationDelay: `${idx * 50 + 150}ms` }}
                              role="img"
                              aria-label={messageLabel || 'Message icon'}
                            >
                              {messageEmoji}
                            </span>
                          )}
                          <div className="text-sm whitespace-pre-wrap leading-relaxed flex-1">
                            {renderMarkdown(m.text)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start mt-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="mr-2 animate-in zoom-in duration-300">
                      <Avatar className="ring-2 ring-primary/50">
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="bg-base-200 p-3 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="flex items-center gap-2 bg-muted rounded-full p-1 ring-2 ring-transparent hover:ring-base-300/30 transition-all duration-300 focus-within:ring-primary/30">
                  <Input
                    className="flex-1 bg-transparent px-3 py-2 rounded-full outline-none transition-all duration-300"
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
                    className={`ml-1 transition-all duration-300 ${
                      input.trim() 
                        ? 'shadow-md hover:shadow-lg hover:scale-110 active:scale-95' 
                        : 'opacity-50'
                    }`}
                  >
                    {loading ? (
                      <Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 text-base-content transition-transform duration-300" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                      >
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
