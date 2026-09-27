import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const COHERE_URL = "https://api.cohere.ai/v1/chat";
const HF_URL_BASE = "https://router.huggingface.co/hf-inference/models";
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";

const GROQ_MODELS = Array.from(
  new Set(
    [
      process.env.GROQ_MODEL,
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ].filter(Boolean) as string[]
  )
);

function localSummary(message: string, income: number, expense: number) {
  const net = income - expense;
  const direction = net >= 0 ? "surplus" : "deficit";
  return [
    "The live AI provider is unavailable, so here is a local summary based on your recent activity:",
    `• Recent income: €${income.toFixed(2)}`,
    `• Recent expenses: €${expense.toFixed(2)}`,
    `• Current ${direction}: €${Math.abs(net).toFixed(2)}`,
    "",
    `For “${message.slice(0, 160)}”, start with one small, measurable action: review your largest recurring expense, then move a fixed amount to savings on payday.`,
  ].join("\n");
}

async function readProviderError(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return {
      message: parsed?.error?.message || parsed?.message || text,
      code: parsed?.error?.code || parsed?.code || "",
    };
  } catch {
    return { message: text || response.statusText, code: "" };
  }
}

/* ------------------------------------------------------------------ *
 * Write actions: the assistant may modify the user's own data.
 * Everything is whitelisted, validated and scoped to the caller.
 * ------------------------------------------------------------------ */

export type AssistantActionType =
  | "create_transaction"
  | "delete_transaction"
  | "create_budget"
  | "create_goal"
  | "create_recurring";

const EXPENSE_CATEGORIES = [
  "Wohnen", "Lebensmittel", "Transport", "Freizeit", "Gesundheit", "Bildung",
  "Kleidung", "Versicherungen", "Abos", "Geschenke", "Reisen", "Sonstiges",
];
const INCOME_CATEGORIES = ["Gehalt", "Bonus", "Zinsen", "Erstattung", "Geschenk", "Sonstiges"];

const ACTION_BLOCK = /<actions>([\s\S]*?)<\/actions>/i;

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed * 100) / 100));
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function parseDate(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function pickCategory(value: unknown, type: "income" | "expense") {
  const allowed = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const raw = cleanText(value, 40);
  const match = allowed.find((category) => category.toLowerCase() === raw.toLowerCase());
  return match ?? (type === "income" ? "Sonstiges" : "Sonstiges");
}

/** Pulls the model's action block out of the reply and validates every entry. */
function extractActions(reply: string) {
  const block = ACTION_BLOCK.exec(reply);
  const cleanReply = reply.replace(ACTION_BLOCK, "").trim();
  if (!block) return { cleanReply, actions: [] as unknown[] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(block[1].trim());
  } catch {
    return { cleanReply, actions: [] as unknown[] };
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const actions = list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .slice(0, 5)
    .map((item) => {
      const action = cleanText(item.action, 40) as AssistantActionType;
      switch (action) {
        case "create_transaction": {
          const type = item.type === "income" ? "income" : "expense";
          return {
            action,
            type,
            amount: clampNumber(item.amount, 0.01, 10_000_000, 0),
            category: pickCategory(item.category, type),
            description: cleanText(item.description, 120) || (type === "income" ? "Einnahme" : "Ausgabe"),
            date: parseDate(item.date).toISOString(),
          };
        }
        case "delete_transaction":
          return { action, description: cleanText(item.description, 120) };
        case "create_budget":
          return {
            action,
            category: pickCategory(item.category, "expense"),
            maxAmount: clampNumber(item.maxAmount ?? item.amount, 1, 10_000_000, 0),
            alertThreshold: clampNumber(item.alertThreshold ?? 80, 1, 100, 80),
          };
        case "create_goal":
          return {
            action,
            name: cleanText(item.name, 60),
            targetAmount: clampNumber(item.targetAmount ?? item.amount, 1, 10_000_000, 0),
            currentAmount: clampNumber(item.currentAmount, 0, 10_000_000, 0),
            dueDate: item.dueDate ? parseDate(item.dueDate).toISOString() : null,
            priority: Math.round(clampNumber(item.priority, 0, 2, 1)),
          };
        case "create_recurring":
          return {
            action,
            type: item.type === "income" ? "income" : "expense",
            amount: clampNumber(item.amount, 0.01, 10_000_000, 0),
            category: pickCategory(item.category, item.type === "income" ? "income" : "expense"),
            description: cleanText(item.description, 120),
            frequency: ["daily", "weekly", "monthly", "yearly"].includes(String(item.frequency))
              ? String(item.frequency)
              : "monthly",
            nextDue: parseDate(item.nextDue).toISOString(),
          };
        default:
          return null;
      }
    })
    .filter(Boolean);

  return { cleanReply, actions };
}

const ACTION_CONTRACT = `You may change the user's data. When the user asks you to log, add, delete, budget, or schedule something, do it instead of only describing it.

Append a single <actions>...</actions> block at the very end of your reply, containing a JSON array. Use only these shapes:
[{"action":"create_transaction","type":"income","amount":1200,"category":"Gehalt","description":"Monatsgehalt","date":"2026-09-26"}]
[{"action":"create_transaction","type":"expense","amount":64,"category":"Transport","description":"Monatsticket","date":"2026-09-26"}]
[{"action":"delete_transaction","description":"exact description of the booking to remove"}]
[{"action":"create_budget","category":"Lebensmittel","maxAmount":400,"alertThreshold":80}]
[{"action":"create_goal","name":"Urlaub 2027","targetAmount":2000,"dueDate":"2027-06-30","priority":1}]
[{"action":"create_recurring","type":"expense","amount":59,"category":"Abos","description":"Streaming","frequency":"monthly","nextDue":"2026-10-01"}]

Rules: valid expense categories are ${EXPENSE_CATEGORIES.join(", ")}; valid income categories are ${INCOME_CATEGORIES.join(", ")}. Never invent an id - to delete, repeat the booking description exactly. Confirm the change in your normal text in the user's language. Emit no <actions> block when the user only asks a question.`;

async function runActions(userId: string, actions: unknown[]) {
  const applied: Array<Record<string, unknown>> = [];

  for (const raw of actions) {
    const action = raw as Record<string, unknown>;
    try {
      if (action.action === "create_transaction") {
        const created = await prisma.transaction.create({
          data: {
            userId,
            type: String(action.type),
            amount: Number(action.amount),
            category: String(action.category),
            description: String(action.description),
            date: new Date(String(action.date)),
          },
        });
        applied.push({ action: "create_transaction", label: `${created.description} · ${created.amount} €`, id: created.id });
      } else if (action.action === "delete_transaction") {
        const deleted = await prisma.transaction.deleteMany({
          where: { userId, description: String(action.description) },
        });
        applied.push({
          action: "delete_transaction",
          label: `${String(action.description)} · ${deleted.count} removed`,
          count: deleted.count,
        });
      } else if (action.action === "create_budget") {
        const saved = await prisma.budget.upsert({
          where: { userId_category: { userId, category: String(action.category) } },
          update: { maxAmount: Number(action.maxAmount), alertThreshold: Number(action.alertThreshold) },
          create: {
            userId,
            category: String(action.category),
            maxAmount: Number(action.maxAmount),
            alertThreshold: Number(action.alertThreshold),
          },
        });
        applied.push({ action: "create_budget", label: `${saved.category} · ${saved.maxAmount} €`, id: saved.id });
      } else if (action.action === "create_goal") {
        const created = await prisma.savingsGoal.create({
          data: {
            userId,
            name: String(action.name),
            targetAmount: Number(action.targetAmount),
            currentAmount: Number(action.currentAmount),
            dueDate: action.dueDate ? new Date(String(action.dueDate)) : null,
            priority: Number(action.priority),
          },
        });
        applied.push({ action: "create_goal", label: `${created.name} · ${created.targetAmount} €`, id: created.id });
      } else if (action.action === "create_recurring") {
        const created = await prisma.recurringTransaction.create({
          data: {
            userId,
            type: String(action.type),
            amount: Number(action.amount),
            category: String(action.category),
            description: String(action.description) || String(action.category),
            frequency: String(action.frequency),
            interval: 1,
            startDate: new Date(),
            nextDue: new Date(String(action.nextDue)),
            isActive: true,
          },
        });
        applied.push({ action: "create_recurring", label: `${created.description} · ${created.amount} €`, id: created.id });
      }
    } catch (actionError) {
      console.error("AI action failed", action.action, actionError);
      applied.push({ action: action.action, label: String(action.description ?? action.name ?? action.category ?? ""), failed: true });
    }
  }

  return applied;
}

type AssistantMode = "balanced" | "reasoning" | "research";

const MODE_PROFILES: Record<
  AssistantMode,
  { take: number; maxTokens: number; temperature: number; instruction: string }
> = {
  balanced: {
    take: 20,
    maxTokens: 700,
    temperature: 0.6,
    instruction:
      "Answer in the user's language. Be concise, concrete and supportive. Lead with the answer, then one short supporting detail.",
  },
  reasoning: {
    take: 20,
    maxTokens: 1100,
    temperature: 0.3,
    instruction:
      "Answer in the user's language. Think through the numbers step by step before answering, then present only the conclusion and the two or three steps that matter. Show the arithmetic you used.",
  },
  research: {
    take: 80,
    maxTokens: 1600,
    temperature: 0.4,
    instruction:
      "Answer in the user's language. Do a full analysis: patterns over time, category breakdown, comparisons to earlier periods, and the three highest-impact findings. Ground every statement in the supplied figures and finish with concrete next steps.",
  },
};

function sanitizeAttachments(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ name: string; text: string }>;
  return value
    .slice(0, 3)
    .map((item) => ({
      name: String(item?.name ?? "file").slice(0, 80),
      text: String(item?.text ?? "").slice(0, 3000),
    }))
    .filter((item) => item.text.trim().length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const mode: AssistantMode =
      body?.mode === "reasoning" || body?.mode === "research" ? body.mode : "balanced";
    const attachments = sanitizeAttachments(body?.attachments);

    if (!message && attachments.length === 0) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    if (process.env.USE_LOCAL_AI === "true") {
      return NextResponse.json({ reply: localSummary(message, 0, 0), degraded: true });
    }

    const profile = MODE_PROFILES[mode];

    let recent: Array<{ type: string; amount: number | null; category: string | null; date: Date }> = [];
    try {
      recent = await prisma.transaction.findMany({
        where: { userId },
        select: { type: true, amount: true, category: true, date: true },
        orderBy: { date: "desc" },
        take: profile.take,
      });
    } catch (dbError) {
      console.error("AI route context query error", dbError);
    }

    const income = recent
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    const expense = recent
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const byCategory = new Map<string, number>();
    for (const transaction of recent) {
      if (transaction.type !== "expense") continue;
      const key = transaction.category || "Other";
      byCategory.set(key, (byCategory.get(key) || 0) + (transaction.amount || 0));
    }
    const topCategories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, total]) => `${category}: €${total.toFixed(2)}`)
      .join(", ");

    const oldest = recent.at(-1)?.date;
    const windowLabel = oldest
      ? `the ${recent.length} most recent transactions (${oldest.toISOString().slice(0, 10)} to ${recent[0].date.toISOString().slice(0, 10)})`
      : "no stored transactions";

    const systemPrompt = [
      "You are SmartBudget, a practical personal finance advisor.",
      `Context: ${windowLabel} total €${income.toFixed(2)} in income and €${expense.toFixed(2)} in expenses.`,
      topCategories ? `Expenses by category: ${topCategories}.` : "",
      attachments.length > 0
        ? `The user attached ${attachments.length} file(s): ${attachments.map((item) => item.name).join(", ")}. Their full contents follow in the user message. Treat that content as real, authoritative user data and answer from it directly.`
        : "",
      profile.instruction,
      "When the user has a savings goal, answer with a short numbered plan.",
      attachments.length > 0
        ? "Never claim the attachment is missing or unavailable."
        : "Never invent transactions, budgets, or goals that are not in the context above. If data is missing, say so.",
      "If a salary change is genuinely appropriate, include the exact phrase 'set salary to <amount>'.",
      ACTION_CONTRACT,
    ]
      .filter(Boolean)
      .join(" ");

    const userContent = [
      message,
      ...attachments.map(
        (attachment) => `\n\n[Attached file: ${attachment.name}]\n${attachment.text}`
      ),
    ].join("");

    if (process.env.GROQ_API_KEY) {
      let lastError = "Groq request failed";

      for (const model of GROQ_MODELS) {
        try {
          const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent },
              ],
              max_tokens: profile.maxTokens,
              temperature: profile.temperature,
            }),
            signal: AbortSignal.timeout(30_000),
            cache: "no-store",
          });

          if (!response.ok) {
            const providerError = await readProviderError(response);
            lastError = providerError.message;
            const canTryNextModel =
              providerError.code === "model_not_found" ||
              /does not exist|decommissioned|not available/i.test(providerError.message);
            if (canTryNextModel && model !== GROQ_MODELS[GROQ_MODELS.length - 1]) continue;
            break;
          }

          const data = await response.json();
          const rawReply = data?.choices?.[0]?.message?.content?.trim();
          if (rawReply) {
            const { cleanReply, actions } = extractActions(rawReply);
            const applied = await runActions(userId, actions);
            return NextResponse.json(
              { reply: cleanReply, actions: applied },
              { headers: { "Cache-Control": "private, no-store" } }
            );
          }

          lastError = "Groq returned an empty response";
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          console.error(`Groq model ${model} failed`, error);
          break;
        }
      }

      console.error("Groq assistant failed", lastError);
      return NextResponse.json(
        { reply: localSummary(message, income, expense), degraded: true },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (process.env.COHERE_API_KEY) {
      const response = await fetch(COHERE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.COHERE_MODEL || "command-a-03-2025",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: profile.maxTokens,
          temperature: profile.temperature,
        }),
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const rawReply = data?.message?.content?.[0]?.text?.content?.trim() || data?.text?.trim();
        if (rawReply) {
          const { cleanReply, actions } = extractActions(rawReply);
          const applied = await runActions(userId, actions);
          return NextResponse.json(
            { reply: cleanReply, actions: applied },
            { headers: { "Cache-Control": "private, no-store" } }
          );
        }
      } else {
        const providerError = await readProviderError(response);
        console.error("Cohere assistant failed", providerError);
      }
    }

    if (process.env.HF_API_KEY) {
      const response = await fetch(`${HF_URL_BASE}/${HF_MODEL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: profile.maxTokens,
          temperature: profile.temperature,
        }),
        signal: AbortSignal.timeout(45_000),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const rawReply = data?.choices?.[0]?.message?.content?.trim();
        if (rawReply) {
          const { cleanReply, actions } = extractActions(rawReply);
          const applied = await runActions(userId, actions);
          return NextResponse.json(
            { reply: cleanReply, actions: applied },
            { headers: { "Cache-Control": "private, no-store" } }
          );
        }
      } else {
        const providerError = await readProviderError(response);
        console.error("Hugging Face assistant failed", providerError);
      }
    }

    return NextResponse.json(
      { reply: localSummary(message, income, expense), degraded: true },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("AI route error", error);
    const message = error instanceof Error ? error.message : String(error);
    if (/unauthorized|forbidden|token|auth/i.test(message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
