import { affectedFunds } from "@/data/funds";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";
import {
  ANALYSIS_DURATION_MS,
  ANALYSIS_PLUGIN_STEP_MS,
  DEMO_FUND_ID,
  FALLBACK_RESPONSE,
} from "@/lib/constants";
import type { AskCopilotOptions, ChatMessage } from "@/types/copilot";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalize(question: string): string {
  return question.trim().toLowerCase();
}

function matchesIncidentFailure(question: string): boolean {
  const q = normalize(question);
  return (
    q.includes("lu0411078552") ||
    q.includes("pcf not publish") ||
    q.includes("today's pcf") ||
    q.includes("todays pcf") ||
    (q.includes("fail") &&
      (q.includes("pcf") || q.includes("fund") || q.includes("lu041"))) ||
    (q.includes("why did") && q.includes("fail"))
  );
}

function matchesAffectedFunds(question: string): boolean {
  const q = normalize(question);
  return (
    q.includes("which funds are affected") ||
    q.includes("affected funds") ||
    q.includes("funds are affected")
  );
}

function matchesOperationsNext(question: string): boolean {
  const q = normalize(question);
  return (
    q.includes("operations do next") ||
    q.includes("what should operations") ||
    q.includes("recommended action")
  );
}

/**
 * Deterministic milestone-1 copilot service.
 * Keyword matching only — UI must not know how responses are produced.
 */
export async function askCopilot(
  question: string,
  context?: AskCopilotOptions
): Promise<ChatMessage> {
  const pluginCount = context?.selectedPlugins?.length ?? 0;
  const duration = ANALYSIS_DURATION_MS + pluginCount * ANALYSIS_PLUGIN_STEP_MS;
  await new Promise((resolve) => setTimeout(resolve, duration));

  const createdAt = new Date().toISOString();
  const fundId = context?.fundId ?? DEMO_FUND_ID;
  const sources = context?.selectedPlugins ?? [];

  if (matchesAffectedFunds(question)) {
    return {
      id: createId("msg"),
      role: "assistant",
      content:
        "Eight synthetic funds are blocked by the same Index Data Service constituent dependency.",
      affectedFunds,
      sources,
      createdAt,
    };
  }

  if (matchesIncidentFailure(question) || matchesOperationsNext(question)) {
    return {
      id: createId("msg"),
      role: "assistant",
      content: pcfIncidentAnalysis.summary,
      analysis: {
        ...pcfIncidentAnalysis,
        fundId,
      },
      sources,
      createdAt,
    };
  }

  return {
    id: createId("msg"),
    role: "assistant",
    content: FALLBACK_RESPONSE,
    sources,
    createdAt,
  };
}

export function buildAnalysisSteps(
  selectedThinkingSteps: string[]
): string[] {
  const base = [
    "Checking publishing run",
    "Correlating service logs",
    "Reviewing business rules",
    "Mapping affected funds",
  ];
  return [...base, ...selectedThinkingSteps, "Synthesizing business impact"];
}
