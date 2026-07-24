"use client";

import { Bug, X } from "lucide-react";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Button } from "@/components/ui/button";

export function JiraDefectSheet() {
  const {
    jiraDraftState,
    confirmDemoJira,
    cancelJiraReview,
  } = useCopilot();

  if (jiraDraftState !== "reviewing") return null;

  const draft = pcfIncidentAnalysis.jiraDraft;

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-900/25 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Raise Jira defect"
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-rose-50 p-1.5 text-rose-700">
              <Bug className="size-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Raise defect in Jira
              </p>
              <p className="text-[11px] text-muted-foreground">
                Drafted from NullPointerException evidence
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close Jira draft"
            onClick={cancelJiraReview}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-2.5 px-3.5 py-3 text-[13px]">
          <div className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Type
            </span>
            <span className="font-medium text-foreground">{draft.type}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Title
            </span>
            <span className="text-foreground">{draft.title}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Team
            </span>
            <span className="text-foreground">{draft.team}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Priority
            </span>
            <span className="text-foreground">{draft.priority}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Points
            </span>
            <span className="text-foreground">{draft.storyPoints}</span>
          </div>
          <p className="rounded-lg border border-border bg-slate-50 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
            Linked to {pcfIncidentAnalysis.fundId} ·{" "}
            {pcfIncidentAnalysis.rootCause}
          </p>
        </div>

        <div className="flex items-center justify-end gap-1.5 border-t border-border px-3.5 py-2.5">
          <Button type="button" variant="ghost" size="xs" onClick={cancelJiraReview}>
            Cancel
          </Button>
          <Button type="button" size="xs" onClick={confirmDemoJira}>
            Create defect
          </Button>
        </div>
      </div>
    </div>
  );
}
