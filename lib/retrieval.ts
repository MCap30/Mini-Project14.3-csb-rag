import { readFileSync } from "node:fs";
import path from "node:path";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

type Chunk = {
  id: string; incident: string; sub_incident: string | null; section_type: string;
  heading_path: string; page_start: number; text: string; embedding: number[];
};

const MIN_SCORE = 0.3;        // tune on your test questions
const SUMMARY_PENALTY = 0;    // raise (e.g. 0.03) if executive summaries crowd out detail

let INDEX: Chunk[] | null = null;
function loadIndex(): Chunk[] {
  if (!INDEX) {
    const file = path.join(process.cwd(), "data", "index.json");
    INDEX = JSON.parse(readFileSync(file, "utf8")) as Chunk[];
  }
  return INDEX;
}

// OpenAI embeddings are unit length, so a dot product equals cosine similarity.
function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export async function search(query: string, opts: { incident?: string; topK?: number } = {}) {
  const { incident, topK = 6 } = opts;
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });
  return loadIndex()
    .filter((c) => !incident || c.id.startsWith(incident + "-"))
    .map((c) => ({
      c,
      score: dot(embedding, c.embedding) - (c.section_type === "executive_summary" ? SUMMARY_PENALTY : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((x) => x.score >= MIN_SCORE)
    .map(({ c, score }) => ({
      id: c.id,
      incident: c.incident,
      subIncident: c.sub_incident,
      section: c.heading_path,
      page: c.page_start,
      score: Number(score.toFixed(3)),
      text: c.text,
    }));
}