import {
  ANALYSIS_DURATION_MS,
  ANALYSIS_PLUGIN_STEP_MS,
} from "@/lib/constants";
import type { AskCopilotOptions, ChatMessage } from "@/types/copilot";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Client entry for Agent10 answers.
 * Calls the server `/api/copilot/ask` route (Gemini + optional logs/Jira APIs).
 */
export async function askCopilot(
  question: string,
  context?: AskCopilotOptions
): Promise<ChatMessage> {
  const pluginCount = context?.selectedPlugins?.length ?? 0;
  const duration = ANALYSIS_DURATION_MS + pluginCount * ANALYSIS_PLUGIN_STEP_MS;
  const delay = new Promise((resolve) => setTimeout(resolve, duration));

  const request = fetch("/api/copilot/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      fundId: context?.fundId,
      processingDate: context?.processingDate,
      selectedPlugins: context?.selectedPlugins,
    }),
  });

  const [, response] = await Promise.all([delay, request]);

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) detail = payload.error;
    } catch {
      // ignore JSON parse errors
    }
    return {
      id: createId("msg"),
      role: "assistant",
      content: `I could not reach Gemini just now: ${detail}`,
      sources: context?.selectedPlugins ?? [],
      createdAt: new Date().toISOString(),
    };
  }

  const payload = (await response.json()) as { message: ChatMessage };
  return payload.message;
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
