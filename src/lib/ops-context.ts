import { affectedFunds } from "@/data/funds";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";
import { DEMO_FUND_ID, PROCESSING_DATE_ISO } from "@/lib/constants";

export interface OpsContextRequest {
  fundId?: string;
  processingDate?: string;
  question: string;
}

export interface LogDetails {
  source: "api" | "mock";
  fundId: string;
  processingDate: string;
  entries: Array<{
    timestamp: string;
    level: string;
    service: string;
    message: string;
  }>;
  summary: string;
}

export interface JiraDetails {
  source: "api" | "mock";
  fundId: string;
  relatedIssues: Array<{
    key: string;
    summary: string;
    status: string;
    priority: string;
    assignee?: string;
  }>;
  draftSuggestion: {
    type: string;
    title: string;
    team: string;
    priority: string;
  };
  summary: string;
}

function mockLogDetails(fundId: string, processingDate: string): LogDetails {
  const logEvidence = pcfIncidentAnalysis.evidence.find((item) => item.kind === "log");
  return {
    source: "mock",
    fundId,
    processingDate,
    entries: [
      {
        timestamp: logEvidence?.timestamp ?? `${processingDate}T09:32:14.118Z`,
        level: "ERROR",
        service: "pcf-calculation-engine",
        message:
          logEvidence?.content ??
          "NullPointerException: securityDetails is null for empty constituent set",
      },
      {
        timestamp: `${processingDate}T09:32:13.901Z`,
        level: "WARN",
        service: "index-data-service",
        message: `Constituent payload empty for fundId=${fundId} effectiveDate=${processingDate}`,
      },
    ],
    summary:
      "PCF calculation failed after Index Data Service returned an empty constituent set.",
  };
}

function mockJiraDetails(fundId: string): JiraDetails {
  const draft = pcfIncidentAnalysis.jiraDraft;
  return {
    source: "mock",
    fundId,
    relatedIssues: [
      {
        key: "PCF-1842",
        summary: `Investigate PCF publish failure for ${fundId}`,
        status: "In Progress",
        priority: "High",
        assignee: "ETF Operations",
      },
      {
        key: "IDS-903",
        summary: "Empty constituent set during EMEA load window",
        status: "Open",
        priority: "Highest",
        assignee: "Index Data Services",
      },
    ],
    draftSuggestion: {
      type: draft.type,
      title: draft.title,
      team: draft.team,
      priority: draft.priority,
    },
    summary:
      "Two related Jira items track the IDS constituent gap and the PCF publish failure.",
  };
}

/**
 * Fetch log details for grounding Agent10 answers.
 * When LOGS_API_URL is set, calls that API; otherwise returns demo mock data.
 */
export async function fetchLogDetails(
  request: OpsContextRequest
): Promise<LogDetails> {
  const fundId = request.fundId ?? DEMO_FUND_ID;
  const processingDate = request.processingDate ?? PROCESSING_DATE_ISO;
  const baseUrl = process.env.LOGS_API_URL?.trim();

  if (!baseUrl) {
    return mockLogDetails(fundId, processingDate);
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("fundId", fundId);
    url.searchParams.set("processingDate", processingDate);
    url.searchParams.set("q", request.question);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Logs API returned ${response.status}`);
    }

    const data = (await response.json()) as Omit<LogDetails, "source">;
    return { ...data, source: "api" };
  } catch (error) {
    console.error("[ops-context] LOGS_API_URL fetch failed, using mock:", error);
    return mockLogDetails(fundId, processingDate);
  }
}

/**
 * Fetch Jira details for grounding Agent10 answers.
 * When JIRA_API_URL is set, calls that API; otherwise returns demo mock data.
 */
export async function fetchJiraDetails(
  request: OpsContextRequest
): Promise<JiraDetails> {
  const fundId = request.fundId ?? DEMO_FUND_ID;
  const baseUrl = process.env.JIRA_API_URL?.trim();

  if (!baseUrl) {
    return mockJiraDetails(fundId);
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("fundId", fundId);
    url.searchParams.set("q", request.question);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Jira API returned ${response.status}`);
    }

    const data = (await response.json()) as Omit<JiraDetails, "source">;
    return { ...data, source: "api" };
  } catch (error) {
    console.error("[ops-context] JIRA_API_URL fetch failed, using mock:", error);
    return mockJiraDetails(fundId);
  }
}

export function buildAffectedFundsNote(): string {
  const ids = affectedFunds.map((fund) => fund.fundId).join(", ");
  return `Affected synthetic funds (${affectedFunds.length}): ${ids}`;
}
