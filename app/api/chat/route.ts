import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { search } from "@/lib/retrieval";

export const maxDuration = 60;

const SYSTEM = `You are "Ask CSB", an assistant that answers questions about six U.S. Chemical Safety Board (CSB) investigation reports:
- PEMEX Deer Park hydrogen sulfide release (2024)
- Shell Polymers Monaca furnace explosion (2025)
- Dow Louisiana Operations ethylene oxide explosions (2023)
- Givaudan Sense Colour runaway reaction and explosion (2024)
- Honeywell Geismar hydrogen fluoride incidents (2021, 2023, 2024)
- Wacker Polysilicon hydrogen chloride release (2020)

Rules:
1. For any substantive question about these incidents (what happened, causes, findings, recommendations, lessons), call searchCsbReports before answering. Do not call it for greetings, thanks, or questions about how you work.
2. Answer ONLY from the retrieved passages. Do not add facts from your own knowledge, even if you know the incident.
3. Cite every factual claim with the passage id in its own square brackets, e.g. [pemex-012][wacker-003]. Use only ids returned by the tool, one id per bracket.
4. If the tool returns no passages, or they do not answer the question, say you could not find it in the six reports, and say what the reports do cover. Do not guess.
5. For comparison questions, search once per incident (use the incident filter) or search without a filter, then compare.
6. Out of scope: other incidents, current regulations or penalties, and the status of recommendations after publication. Say these are outside the reports.
7. Be concise and plain. This is a learning aid, not a substitute for the original reports or professional judgement.`;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
  if (!Array.isArray(messages) || messages.length > 24) {
    return new Response("Conversation too long. Please start a new chat.", { status: 400 });
  }

  const last = messages[messages.length - 1];
  const lastText = (last?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");
  if (lastText.length > 600) {
    return new Response("Question too long. Please shorten it.", { status: 400 });
  }

  const result = streamText({
    model: openai(process.env.CHAT_MODEL ?? "gpt-5.4-mini"),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(4),
       maxOutputTokens: 1500,
    tools: {
      searchCsbReports: tool({
        description:
          "Search the six CSB investigation reports (PEMEX Deer Park, Shell Polymers Monaca, Dow Louisiana, Givaudan Sense Colour, Honeywell Geismar, Wacker Polysilicon). Use for any question about what happened, causes, findings, recommendations, or lessons from these incidents. Returns the most relevant passages with ids and page numbers. Do not use for greetings or general chit-chat.",
        inputSchema: z.object({
          query: z.string().describe("A specific search query in plain words, rewritten from the user's question."),
          incident: z
            .enum(["pemex", "monaca", "dow", "givaudan", "geismar", "wacker"])
            .optional()
            .describe("Only set when the user is asking about one specific incident."),
        }),
        execute: async ({ query, incident }) => {
          const results = await search(query, { incident, topK: incident ? 5 : 8 });
          return results.length
            ? { results }
            : { results: [], note: "No passages passed the relevance threshold." };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}