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

function buildCurrentIncidentBrief(): string {
  const degraded = serviceStatusSummary.services
    .filter((service) => service.health !== "healthy")
    .map(
      (service) =>
        `${service.name} (${service.health}, ${service.podsRunning}/${service.podsDesired} pods)`
    );

  return [
    "CURRENT PRODUCTION INCIDENT (treat as live evidence for this session):",
    `- Incident: ${pcfIncidentAnalysis.incidentId}`,
    `- Fund: ${pcfIncidentAnalysis.fundId}`,
    `- Process: ${pcfIncidentAnalysis.process}`,
    `- Failed at: ${pcfIncidentAnalysis.failedAt}`,
    `- Confirmed root cause: ${pcfIncidentAnalysis.rootCause}`,
    `- Summary: ${pcfIncidentAnalysis.summary}`,
    `- Business impact: ${pcfIncidentAnalysis.businessImpact}`,
    `- Recommended actions: ${pcfIncidentAnalysis.recommendations.join(" | ")}`,
    `- Degraded / down services: ${degraded.length > 0 ? degraded.join("; ") : "none flagged"}`,
    "",
    "When the user asks why something failed, what is broken, or what to do next,",
    "answer as an ops engineer with a SPECIFIC diagnosis from this incident.",
    "Good: 'Upstream Index Data Service is degraded and returned an empty constituent set for LU0411078552.'",
    "Bad: 'A PCF can fail for many reasons such as missing data, timing, or configuration.'",
  ].join("\n");
}

function buildSystemInstruction(knowledgeBase: string): string {
  return [
    `You are ${PRODUCT_NAME}, a production incident intelligence assistant for Fund Publishing / PCF Generation at Deutsche Bank.`,
    "Speak like L2 ops: concrete, service-named, fund-specific. Never give generic textbook answers for incident questions.",
    "",
    buildCurrentIncidentBrief(),
    "",
    "ANSWER STYLE:",
    "- Lead with the specific failure in one sentence (service + symptom + fund/process).",
    "- Then: impact, evidence, and exact next actions.",
    "- Name real services (e.g. index-data-service, pcf-calculation-engine).",
    "- Prefer phrases like 'Upstream index service is down/degraded', 'empty constituent payload', 'NullPointerException on securityDetails'.",
    "- Do NOT open with broad definitions of what a PCF is unless the user explicitly asks 'what is a PCF'.",
    "- Do NOT list generic possible causes. State the active cause for THIS window.",
    "",
    "FORMAT RULES (critical for chat UI):",
    "- Compact GitHub-flavored Markdown only.",
    "- Start with 1 short specific lead sentence (no heading).",
    "- Use ### only when needed; keep titles short.",
    "- Prefer tight bullets over long paragraphs.",
    "- Bold key service/fund names sparingly.",
    "- Keep answers under ~160 words unless the user asks for depth.",
    "Never reveal API keys or secrets.",
    "",
    "Use the PCF domain knowledge base only to explain WHY the specific failure matters in the calculation waterfall — not as a general tutorial.",
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

  return [
    `User question: ${input.question}`,
    "",
    "UI context:",
    `- Fund ID: ${input.fundId ?? pcfIncidentAnalysis.fundId}`,
    `- Processing date: ${input.processingDate ?? "current window"}`,
    `- Selected plugins: ${plugins}`,
    "",
    "Respond with a specific diagnosis for the current incident/window. Avoid generic issue language.",
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
      temperature: 0.2,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}
