import { readFileSync, writeFileSync } from "node:fs";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

const rows = readFileSync("data/chunks.jsonl", "utf8")
  .split("\n").filter(Boolean).map((l) => JSON.parse(l));
console.log(`Embedding ${rows.length} chunks...`);

const BATCH = 100;
const out = [];
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: batch.map((r) => r.embed_text),
  });
  batch.forEach((r, j) => {
    const { embed_text, ...meta } = r;
    out.push({ ...meta, embedding: embeddings[j].map((x) => Number(x.toFixed(6))) });
  });
  console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
}
writeFileSync("data/index.json", JSON.stringify(out));
console.log("Wrote data/index.json");