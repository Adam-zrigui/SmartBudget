import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// AI provider URLs
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const COHERE_URL = "https://api.cohere.ai/v1/generate";
const HF_URL_BASE = "https://api-inference.huggingface.co/models";
// HF model placeholder
const HF_MODEL = process.env.HF_MODEL || "facebook/blenderbot-400M-distill";

export async function POST(req: NextRequest) {
  try {
    // Get Firebase user ID from token
    const userId = await getAuthenticatedUserId(req);

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // if USE_LOCAL_AI is set, we don't call any external API and return a simple heuristic reply
    if (process.env.USE_LOCAL_AI === 'true') {
      // very naive mock: echo with a prefix or give a generic tip
      const reply = `Local AI says: "${message}". Tip: track your expenses and save 10% of income.`;
      return NextResponse.json({ reply });
    }

    // Optionally gather context from recent transactions.
    // If the transactions table is unavailable (e.g. fresh DB), continue with zeroed context.
    let recent: Array<{ type: string; amount: number | null }> = [];
    try {
      recent = await prisma.transaction.findMany({
        where: { userId },
        select: {
          type: true,
          amount: true,
        },
        orderBy: { date: "desc" },
        take: 20,
      });
    } catch (dbErr: any) {
      const code = String(dbErr?.code || "");
      if (code !== "P2021") {
        console.error("AI route context query error", dbErr);
      }
      recent = [];
    }
    const income = recent.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = recent.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

    const systemPrompt = `You are a helpful financial advisor. The user has recent total income ${income} and expenses ${expense}. They may tell you things like "I want to save for travel", "I want to invest into stocks", "help me reach a €5k goal", or similar future‑oriented objectives. When they do, respond with a clear, step‑by‑step plan (number the steps) describing how they can reach that goal; include concrete recommendations such as adjusting salary, reducing categories of spending, investing a portion, or creating a dedicated savings category.  Always answer conversationally, and if you suggest a salary change include a phrase like "set salary to 3000" so the UI can detect and apply it.`;


    // we'll assign the response to `r` – declare it once so we don't trigger a reference
    // error when writing in strict mode.
    let r: Response;

    // use Groq if configured (primary provider)
    if (process.env.GROQ_API_KEY) {
      const groqBody = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 300,
        temperature: 0.7,
      };
      r = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(groqBody),
      });
    } else if (process.env.COHERE_API_KEY) {
      const cohBody = {
        model: "command-xlarge-nightly",
        prompt: `${systemPrompt}\nUser: ${message}`,
        max_tokens: 300,
        temperature: 0.7,
      };
      r = await fetch(COHERE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        },
        body: JSON.stringify(cohBody),
      });
    } else if (process.env.HF_API_KEY) {
      const hfBody = { inputs: `${systemPrompt}\nUser: ${message}`, parameters: { max_new_tokens: 300 } };
      r = await fetch(`${HF_URL_BASE}/${HF_MODEL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        body: JSON.stringify(hfBody),
      });
    } else {
      return NextResponse.json({ error: "No AI provider configured (GROQ_API_KEY, COHERE_API_KEY or HF_API_KEY required)." }, { status: 500 });
    }

    if (!r.ok) {
      const text = await r.text();
      console.error("AI provider error", text);
      // try interpret JSON
      let msg = text;
      try {
        const obj = JSON.parse(text);
        if (obj?.error?.message) msg = obj.error.message;
        if (obj?.error?.code === 'insufficient_quota') {
          msg = 'Quota exceeded – please top up your API key.';
        }
      } catch {}
      const safe = typeof msg === 'string' ? msg.slice(0, 1000) : String(msg);
      return NextResponse.json({ error: `AI request failed: ${safe}` }, { status: 502 });
    }

    let reply = "";
    const data = await r.json();
    if (process.env.GROQ_API_KEY) {
      // Groq returns OpenAI-compatible format: { choices: [{ message: { content: "..." } }] }
      if (data?.choices && data.choices[0]?.message?.content) {
        reply = data.choices[0].message.content;
      } else if (data.error) {
        console.error('Groq error', data);
        return NextResponse.json({ error: `Groq error: ${data.error.message || data.error}` }, { status: 502 });
      }
    } else if (process.env.COHERE_API_KEY) {
      // Cohere returns { generations: [{ text: "..." }] }
      if (data?.generations && data.generations[0]?.text) {
        reply = data.generations[0].text;
      } else if (data.error) {
        console.error('Cohere error', data);
        return NextResponse.json({ error: `Cohere error: ${data.error}` }, { status: 502 });
      }
    } else if (process.env.HF_API_KEY) {
      if (Array.isArray(data) && data[0]?.generated_text) {
        reply = data[0].generated_text;
      } else if (data.error) {
        console.error('HF error', data);
        return NextResponse.json({ error: `HF inference error: ${data.error}` }, { status: 502 });
      }
    }
    // Return with cache headers (cache for 1 hour)
    return NextResponse.json({ reply }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (err) {
    console.error("AI route error", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
