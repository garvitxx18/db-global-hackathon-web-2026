import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { serviceStatusSummary } from "@/data/copilot-sessions";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";
import { PRODUCT_NAME } from "@/lib/constants";
import type { PluginId } from "@/types/copilot";

export interface GeminiAskInput {
  question: string;
  fundId?: string;
  processingDate?: string;
  selectedPlugins?: Array<{ id: PluginId; name: string }>;
}

let cachedKnowledgeBase: string | null = null;

function loadPcfKnowledgeBase(): string {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;
  const path = join(process.cwd(), "src/data/pcf-domain-knowledge-base.md");
  cachedKnowledgeBase = readFileSync(path, "utf8");
  return cachedKnowledgeBase;
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

/** True when the user is asking about today's failure / ops triage. */
export function isIncidentTriageQuestion(question: string): boolean {
  const q = question.trim().toLowerCase();
  if (!q) return false;

  const conceptualOnly =
    /^(what is|what's|define|explain|how does|how do|difference between|meaning of)\b/.test(
      q
    ) &&
    !/\b(fail|failed|failure|broken|down|error|incident|why did|blocked|not publish|nullpointer|npe)\b/.test(
      q
    );

  if (conceptualOnly) return false;

  return (
    /\b(fail|failed|failure|broken|down|degraded|error|exception|nullpointer|npe|incident|root cause|why did|what happened|blocked|not publish|didn't publish|did not publish|operations do next|what should|recommended action|affected funds|which funds)\b/.test(
      q
    ) ||
    q.includes("lu0411078552") ||
    q.includes("today's pcf") ||
    q.includes("todays pcf")
  );
}

function buildCurrentIncidentBrief(): string {
  const degraded = serviceStatusSummary.services
    .filter((service) => service.health !== "healthy")
    .map(
      (service) =>
        `${service.name} (${service.health}, ${service.podsRunning}/${service.podsDesired} pods)`
    );

  return [
    "CURRENT PRODUCTION INCIDENT (use ONLY for triage / failure questions):",
    `- Incident: ${pcfIncidentAnalysis.incidentId}`,
    `- Fund: ${pcfIncidentAnalysis.fundId}`,
    `- Process: ${pcfIncidentAnalysis.process}`,
    `- Failed at: ${pcfIncidentAnalysis.failedAt}`,
    `- Confirmed root cause: ${pcfIncidentAnalysis.rootCause}`,
    `- Summary: ${pcfIncidentAnalysis.summary}`,
    `- Business impact: ${pcfIncidentAnalysis.businessImpact}`,
    `- Recommended actions: ${pcfIncidentAnalysis.recommendations.join(" | ")}`,
    `- Degraded / down services: ${degraded.length > 0 ? degraded.join("; ") : "none flagged"}`,
  ].join("\n");
}

function buildSystemInstruction(knowledgeBase: string): string {
  return [
    `You are ${PRODUCT_NAME}, an assistant for Fund Publishing / PCF Generation at Deutsche Bank.`,
    "Answer the user's actual question. Do not drag every answer into the active fund failure.",
    "",
    "ROUTING RULES (critical):",
    "1) Conceptual / definition questions (e.g. what is NOSH, what is a PCF, how does waterfall work):",
    "   - Answer from the PCF domain knowledge base.",
    "   - Explain the concept clearly and concretely.",
    "   - Do NOT mention the current incident, NullPointerException, empty constituents, or LU0411078552 failure unless the user explicitly asks about that failure.",
    "2) Incident / triage questions (why failed, what is broken, what next, affected funds, today's PCF):",
    "   - Use the CURRENT PRODUCTION INCIDENT evidence.",
    "   - Lead with a specific diagnosis (service + symptom + fund).",
    "   - Prefer concrete ops language, e.g. upstream index-data-service degraded / empty constituent payload.",
    "   - Do NOT give generic 'many possible causes' answers.",
    "",
    buildCurrentIncidentBrief(),
    "",
    "FORMAT RULES:",
    "- Compact GitHub-flavored Markdown only.",
    "- Start with 1 short lead sentence that answers the asked question (no heading).",
    "- Prefer tight bullets over long paragraphs.",
    "- Keep under ~160 words unless the user asks for depth.",
    "Never reveal API keys or secrets.",
    "",
    "=== PCF DOMAIN KNOWLEDGE BASE START ===",
    knowledgeBase,
    "=== PCF DOMAIN KNOWLEDGE BASE END ===",
  ].join("\n");
}

function buildUserPrompt(input: GeminiAskInput): string {
  const plugins =
    input.selectedPlugins && input.selectedPlugins.length > 0
      ? input.selectedPlugins.map((plugin) => plugin.name).join(", ")
      : "none selected";
  const triage = isIncidentTriageQuestion(input.question);

  return [
    `User question: ${input.question}`,
    "",
    "UI context:",
    `- Fund ID in UI (may be unrelated to the question): ${input.fundId ?? "not specified"}`,
    `- Processing date: ${input.processingDate ?? "current window"}`,
    `- Selected plugins: ${plugins}`,
    `- Question mode: ${triage ? "INCIDENT_TRIAGE" : "CONCEPTUAL_OR_GENERAL"}`,
    "",
    triage
      ? "Mode=INCIDENT_TRIAGE: answer with the current production incident diagnosis."
      : "Mode=CONCEPTUAL_OR_GENERAL: answer the asked concept from the knowledge base. Do not pivot to the fund failure unless the user asked about it.",
  ].join("\n");
}

export async function generateCopilotAnswer(
  input: GeminiAskInput
): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest";
  const ai = getClient();
  const knowledgeBase = loadPcfKnowledgeBase();

  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(input),
    config: {
      systemInstruction: buildSystemInstruction(knowledgeBase),
      temperature: 0.25,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}
