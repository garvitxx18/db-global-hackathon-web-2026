"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { DEMO_FUND_ID, PROCESSING_DATE } from "@/lib/constants";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Button } from "@/components/ui/button";

export function IncidentStrip() {
  const { openCopilot } = useCopilot();

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-amber-100 p-1.5 text-warning">
          <AlertTriangle className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-amber-950">
            8 synthetic fund publications are blocked by a constituent data
            dependency.
          </p>
          <p className="mt-0.5 text-xs text-amber-800/80">
            Shared dependency: Index Data Service · Window {PROCESSING_DATE}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-white"
          onClick={() =>
            openCopilot(
              { fundId: DEMO_FUND_ID, processingDate: PROCESSING_DATE },
              "Which funds are affected?"
            )
          }
        >
          View affected funds
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-primary text-primary-foreground"
          onClick={() =>
            openCopilot(
              { fundId: DEMO_FUND_ID, processingDate: PROCESSING_DATE },
              "Why did today's PCF not publish?"
            )
          }
        >
          <Sparkles className="size-3.5" aria-hidden />
          Ask Agent10
        </Button>
      </div>
    </div>
  );
}
