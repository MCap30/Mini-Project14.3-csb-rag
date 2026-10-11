import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const RUNS = Number(process.argv[3] ?? 1);

const QUESTIONS = [
  { id: "Q1", type: "single", q: "How did the workers end up opening the wrong flange at PEMEX?" },
  { id: "Q2", type: "single", q: "What caused the furnace explosion at Shell Polymers Monaca?" },
  { id: "Q3", type: "single", q: "What did the CSB recommend to Shell Polymers?" },
  { id: "Q4", type: "single", q: "What mechanical integrity problems did the CSB find in the 2023 Honeywell reboiler explosion?" },
  { id: "Q5", type: "single", q: "Why was Reactor 6's relief system inadequate at Givaudan?" },
  { id: "Q6", type: "single", q: "What was the means-of-egress problem in the Wacker incident?" },
  { id: "Q7", type: "cross", q: "Which incidents involved problems with pressure relief systems?" },
  { id: "Q8", type: "cross", q: "What do the PEMEX and Wacker incidents have in common?" },
  { id: "Q9", type: "cross", q: "Which of the reports made recommendations to OSHA?" },
  { id: "Q10", type: "out", q: "Has PEMEX closed the CSB's recommendations yet?" },
  { id: "Q11", type: "out", q: "What's the best way to size a pressure relief valve?" },
  { id: "Q12", type: "out", q: "What did the CSB conclude about the Evergreen Packaging incident?" },
  { id: "Q13", type: "greeting", q: "Hi, what can you help me with?" },
];

async function ask(q) {
  const body = { messages: [{ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: q }] }] };
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) return { status: res.status, error: raw.slice(0, 300) };

  let text = "";
  const toolCalls = [];
  const retrieved = [];
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let ev;
    try { ev = JSON.parse(payload); } catch { continue; }
    if (ev.type === "text-delta") text += ev.delta ?? ev.textDelta ?? "";
    if (ev.type === "tool-input-available") toolCalls.push({ tool: ev.toolName, input: ev.input });
    if (ev.type === "tool-output-available") {
      for (const r of ev.output?.results ?? []) {
        retrieved.push({ id: r.id, section: r.section, page: r.page, score: r.score });
      }
    }
  }
  return { status: res.status, text, toolCalls, retrieved, ...(text ? {} : { raw: raw.slice(0, 3000) }) };
}

const results = [];
for (const item of QUESTIONS) {
  for (let run = 1; run <= RUNS; run++) {
    process.stdout.write(`${item.id} run ${run}... `);
    try {
      const out = await ask(item.q);
      results.push({ ...item, run, ...out });
      console.log(out.error ? `ERROR ${out.status}` : `${out.toolCalls.length} search call(s), ${out.text.length} chars`);
    } catch (e) {
      results.push({ ...item, run, error: String(e) });
      console.log("FAILED", e.message);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

writeFileSync(process.argv[4] ?? "test-run.json", JSON.stringify({ base: BASE, date: new Date().toISOString(), results }, null, 1));
console.log("Wrote", process.argv[4] ?? "test-run.json");