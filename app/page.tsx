"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import type { UIMessage } from "ai";

type Source = { id: string; incident: string; section: string; page: number; text: string };

const CITE = /\[([a-z]+-\d{3})\]/g;

const SUGGESTIONS = [
  "What caused the PEMEX Deer Park hydrogen sulfide release?",
  "Which incidents involved inadequate pressure relief?",
  "What did CSB recommend after the Shell Polymers Monaca explosion?",
  "How did simultaneous operations contribute to the Wacker incident?",
];

function collectSources(m: UIMessage): Source[] {
  const out: Source[] = [];
  for (const p of m.parts) {
    const part = p as { type: string; state?: string; output?: unknown };
    if (part.type === "tool-searchCsbReports" && part.state === "output-available") {
      const results = (part.output as { results?: Source[] }).results ?? [];
      for (const r of results) if (!out.some((s) => s.id === r.id)) out.push(r);
    }
  }
  return out;
}

function citedSources(text: string, all: Source[]): Source[] {
  const order: Source[] = [];
  text.replace(CITE, (_m, id: string) => {
    const s = all.find((x) => x.id === id);
    if (s && !order.includes(s)) order.push(s);
    return "";
  });
  return order;
}

function withNumbers(text: string, order: Source[]): string {
  return text.replace(CITE, (_m, id: string) => {
    const i = order.findIndex((s) => s.id === id);
    return i >= 0 ? `[${i + 1}]` : "";
  });
}

function Message({ m }: { m: UIMessage }) {
  const raw = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  if (m.role === "user") {
    return <div className="ml-auto max-w-[85%] rounded-2xl bg-neutral-900 px-4 py-2 text-white">{raw}</div>;
  }
  const order = citedSources(raw, collectSources(m));
  const searching = m.parts.some((p) => {
    const x = p as { type: string; state?: string };
    return x.type === "tool-searchCsbReports" && (x.state === "input-streaming" || x.state === "input-available");
  });
  return (
    <div className="max-w-[95%]">
      {searching && <p className="mb-1 text-sm text-neutral-500">Searching the reports…</p>}
      <p className="whitespace-pre-wrap">{withNumbers(raw, order)}</p>
      {order.length > 0 && (
        <div className="mt-3 border-t border-neutral-200 pt-2 text-sm">
          <p className="font-medium">Sources</p>
          <ol className="mt-1 space-y-1">
            {order.map((s, i) => (
              <li key={s.id}>
                <details>
                  <summary className="cursor-pointer">
                    [{i + 1}] {s.incident} — {s.section} (starts p.{s.page})
                  </summary>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-600">{s.text.slice(0, 600)}…</p>
                </details>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold">Ask CSB</h1>
          <p className="text-neutral-600">Lessons from six U.S. Chemical Safety Board investigations</p>
        </header>

        <div className="flex-1 space-y-6 py-6">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-neutral-700">
                Ask about causes, findings, and recommendations from: PEMEX Deer Park (2024), Shell Polymers Monaca
                (2025), Dow Louisiana (2023), Givaudan Sense Colour (2024), Honeywell Geismar (2021–2024), and Wacker
                Polysilicon (2020). Answers come only from these reports, with citations. It is a learning aid, not a
                substitute for the originals.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => <Message key={m.id} m={m} />)}
          {status === "submitted" && <p className="text-sm text-neutral-500">Thinking…</p>}
          {error && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="sticky bottom-0 flex gap-2 bg-white py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about these incidents…"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2"
          />
          <button disabled={busy} className="rounded-lg bg-neutral-900 px-4 py-2 text-white disabled:opacity-50">
            Ask
          </button>
        </form>
      </main>
    </div>
  );
}