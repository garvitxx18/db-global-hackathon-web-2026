import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
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

function buildSystemInstruction(knowledgeBase: string): string {
  return [
    `You are ${PRODUCT_NAME}, a business-aware incident intelligence assistant for Fund Publishing Operations at Deutsche Bank.`,
    "Answer PCF / portfolio composition / ETF publishing questions using the domain knowledge base below.",
    "Be concise, accurate, and practical for ETF Operations, support, and engineering.",
    "FORMAT RULES (critical for chat UI):",
    "- Reply in compact GitHub-flavored Markdown only.",
    "- Start with 1 short lead sentence (no heading).",
    "- Use ### for section titles only when needed; keep titles short.",
    "- Prefer tight numbered or bulleted lists over long paragraphs.",
    "- Bold key terms with **term** sparingly.",
    "- Put formulas on their own line using $$ ... $$ (KaTeX).",
    "- Avoid walls of text, horizontal rules, and nested lists deeper than 2 levels.",
    "- Keep the whole answer scannable in under ~180 words unless the user asks for depth.",
    "Distinguish approved domain rules from assumptions. Do not invent production facts that are not in the knowledge base or the UI context.",
    "If the question is about a specific live incident and the knowledge base only has general rules, explain the general PCF concept and note what live evidence would still be needed.",
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

  return [
    `User question: ${input.question}`,
    "",
    "UI context (optional):",
    `- Fund ID: ${input.fundId ?? "not specified"}`,
    `- Processing date: ${input.processingDate ?? "not specified"}`,
    `- Selected plugins: ${plugins}`,
    "",
    "Answer using the PCF domain knowledge base. Do not use or mention any orchestrator/API evidence.",
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
      temperature: 0.3,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}
