import { NextResponse } from "next/server";
import { affectedFunds } from "@/data/funds";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";
import { DEMO_FUND_ID, PROCESSING_DATE_ISO } from "@/lib/constants";
import { generateCopilotAnswer } from "@/lib/gemini";
import type { AskCopilotOptions, ChatMessage, PluginId } from "@/types/copilot";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AskBody extends AskCopilotOptions {
  question?: string;
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function wantsAffectedFunds(question: string): boolean {
  const q = question.trim().toLowerCase();
  return (
    q.includes("which funds are affected") ||
    q.includes("affected funds") ||
    q.includes("funds are affected") ||
    q.includes("what are all the funds") ||
    q.includes("all the funds")
  );
}

function wantsIncidentAnalysis(question: string): boolean {
  const q = question.trim().toLowerCase();
  return (
    q.includes("lu0411078552") ||
    q.includes("pcf not publish") ||
    q.includes("today's pcf") ||
    q.includes("todays pcf") ||
    (q.includes("fail") &&
      (q.includes("pcf") || q.includes("fund") || q.includes("lu041"))) ||
    (q.includes("why did") && q.includes("fail")) ||
    q.includes("operations do next") ||
    q.includes("what should operations") ||
    q.includes("recommended action")
  );
}

function isPluginId(value: string): value is PluginId {
  return [
    "openshift",
    "gcp",
    "scribe",
    "confluence",
    "jira",
    "teams",
    "db-omni",
    "db-unity",
    "db-support-plus",
    "db-notifier",
  ].includes(value);
}

export async function POST(request: Request) {
  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const fundId = body.fundId ?? DEMO_FUND_ID;
  const processingDate = body.processingDate ?? PROCESSING_DATE_ISO;
  const selectedPlugins = (body.selectedPlugins ?? []).filter((plugin) =>
    isPluginId(plugin.id)
  );

  // Orchestrator API intentionally skipped for now — answers come from
  // the PCF domain knowledge base via Gemini only.
  try {
    const content = await generateCopilotAnswer({
      question,
      fundId,
      processingDate,
      selectedPlugins,
    });

    const message: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      content,
      sources: selectedPlugins,
      createdAt: new Date().toISOString(),
      ...(wantsAffectedFunds(question) ? { affectedFunds } : {}),
      ...(wantsIncidentAnalysis(question)
        ? {
            analysis: {
              ...pcfIncidentAnalysis,
              fundId,
            },
          }
        : {}),
    };

    return NextResponse.json({
      message,
      evidence: {
        knowledgeBase: "pcf-domain-knowledge-base",
        orchestratorUsed: false,
      },
    });
  } catch (error) {
    console.error("[api/copilot/ask] Gemini error:", error);
    const detail =
      error instanceof Error ? error.message : "Failed to generate answer";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
