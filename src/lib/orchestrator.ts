export const DEFAULT_ORCHESTRATOR_URL =
  "https://incident-orchestrator-648336338393.us-central1.run.app/api/v1/orchestrate";

export const DEFAULT_APPLICATION_ID = "abcd_123";

export interface OrchestratorRequest {
  application_id: string;
  user_query: string;
}

export interface OrchestratorResult {
  ok: boolean;
  source: "api" | "unavailable";
  status?: string;
  raw: unknown;
  error?: string;
}

/**
 * Calls the incident orchestrator for log/Jira-backed evidence.
 * Always returns a result object — never throws — so Gemini can still answer.
 */
export async function fetchOrchestratorEvidence(
  userQuery: string,
  applicationId?: string
): Promise<OrchestratorResult> {
  const url =
    process.env.ORCHESTRATOR_API_URL?.trim() || DEFAULT_ORCHESTRATOR_URL;
  const appId =
    applicationId?.trim() ||
    process.env.ORCHESTRATOR_APPLICATION_ID?.trim() ||
    DEFAULT_APPLICATION_ID;

  const body: OrchestratorRequest = {
    application_id: appId,
    user_query: userQuery,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();
    let raw: unknown = text;
    try {
      raw = text ? JSON.parse(text) : null;
    } catch {
      // keep raw text
    }

    if (!response.ok) {
      return {
        ok: false,
        source: "unavailable",
        raw,
        error: `Orchestrator returned HTTP ${response.status}`,
      };
    }

    const status =
      raw && typeof raw === "object" && "status" in raw
        ? String((raw as { status: unknown }).status)
        : undefined;

    return {
      ok: true,
      source: "api",
      status,
      raw,
    };
  } catch (error) {
    console.error("[orchestrator] fetch failed:", error);
    return {
      ok: false,
      source: "unavailable",
      raw: null,
      error: error instanceof Error ? error.message : "Orchestrator request failed",
    };
  }
}
