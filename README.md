# Ask CSB: plain-language answers from six CSB investigation reports

A public RAG chatbot over six U.S. Chemical Safety Board (CSB) final investigation reports. It answers questions about what happened, why, and what the CSB recommended, explains in plain language, and cites the report sections it used. It answers only from the reports and says so when something is not covered.

**Live app:** https://mini-project14-3-csb-rag.vercel.app

## Corpus

Six CSB final reports (US government publications):

| Incident | Report page |
|---|---|
| PEMEX Deer Park H2S release | https://www.csb.gov/pemex-deer-park-chemical-release-/ |
| Shell Polymers Monaca furnace explosion | https://www.csb.gov/shell-polymers-furnace-explosion-and-fire/ |
| Dow Louisiana Operations explosions | https://www.csb.gov/dow-louisiana-operations-explosions/ |
| Givaudan Sense Colour explosion | https://www.csb.gov/givaudan-sense-colour-explosion-/ |
| Honeywell Geismar HF and chlorine releases (3 incidents) | https://www.csb.gov/honeywell-geismar-chlorine-and-hydrogen-fluoride-releases/ |
| Wacker Polysilicon chemical release | https://www.csb.gov/wacker-polysilicon-chemical-release/ |

About 460 pages, split into 314 chunks. Only the final reports are included (no investigation updates or translations). Excluded on purpose: abbreviations, references, surrounding-area descriptions, causal-analysis diagrams, and the Givaudan reactivity-test appendix (the PDF only points to the CSB website).

## How it works

- **Chunking:** each report is split at its own PDF bookmarks (sections). Short neighbouring sections are packed together, long sections are split at sentence boundaries with a small overlap. Every chunk keeps the incident, section heading path, page where the section starts, and section type. The incident and heading path are prepended to the text before embedding.
- **Embeddings:** OpenAI `text-embedding-3-small`, stored in `data/index.json`. Retrieval is cosine similarity in memory (no vector database).
- **Retrieval as a tool call:** the chat model decides when to call `searchCsbReports`. It is skipped for greetings and out-of-scope questions. The tool can filter to a single incident.
- **Answers:** streamed with the Vercel AI SDK. The system prompt requires answers from retrieved passages only, citations by passage id, plain language, and an explicit "not in the reports" reply when nothing supports an answer.
- **UI:** empty state with scope and suggested questions, numbered citations, and expandable sources showing section and starting page.

## Run locally

Requires Node 20+ and an OpenAI API key.

```bash
npm install
cp .env.example .env.local      # then fill in OPENAI_API_KEY (and CHAT_MODEL)
node --env-file=.env.local scripts/ingest.mjs   # builds data/index.json from data/chunks.jsonl
npm run dev
```

`data/chunks.jsonl` is the prepared corpus. `data/index.json` is the embedded version used at runtime and is committed so the deployed app needs no ingestion step.

## Environment variables

| Name | Purpose |
|---|---|
| `OPENAI_API_KEY` | Server-side only. Never exposed to the client |
| `CHAT_MODEL` | OpenAI chat model name |

## Deploy

Push to GitHub and import the repo in Vercel. Add the two environment variables in the project settings before the first build. `next.config.ts` includes `data/index.json` in the chat function bundle.

## Known limitations

- Covers only these six reports, not all CSB investigations or any current regulation.
- Citations show the section where a passage starts, so page numbers are approximate for long sections.
- Retrieval can favour broad passages (executive summaries) for general questions.
- The relevance score does not separate answerable from unanswerable questions; refusals depend on the system prompt.
- Learning aid only, not a substitute for the original reports or professional judgement.

## Cost and abuse controls

Questions are limited to 600 characters, conversations to 24 messages, and answers to 1,500 output tokens.