"use client";

import { MoreHorizontal, Sparkles } from "lucide-react";
import type {
  PcfCalculationStatus,
  PublishingRun,
  PublishingStatus,
} from "@/types/incidents";
import { PROCESSING_DATE } from "@/lib/constants";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: PublishingStatus }) {
  const styles: Record<PublishingStatus, string> = {
    Published: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Failed: "border-rose-200 bg-rose-50 text-rose-700",
    "In Progress": "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {status}
    </Badge>
  );
}

function CalculationBadge({ status }: { status: PcfCalculationStatus }) {
  const styles: Record<PcfCalculationStatus, string> = {
    Queued: "border-slate-200 bg-slate-50 text-slate-600",
    "Loading constituents": "border-amber-200 bg-amber-50 text-amber-800",
    "Calculating basket": "border-sky-200 bg-sky-50 text-sky-800",
    "Validating controls": "border-violet-200 bg-violet-50 text-violet-800",
    Published: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Failed: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {status}
    </Badge>
  );
}

export function PublishingRunsTable({ runs }: { runs: PublishingRun[] }) {
  const { openCopilot } = useCopilot();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            PCF generation runs
          </h2>
          <p className="text-xs text-muted-foreground">
            Listed PCFs and calculation status · {PROCESSING_DATE}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">PCF / Fund</th>
              <th className="px-4 py-2.5 font-medium">PCF type</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                Region
              </th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                Creation unit
              </th>
              <th className="px-4 py-2.5 font-medium">Calculation status</th>
              <th className="px-4 py-2.5 font-medium">Run status</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                className={cn(
                  "border-t border-border transition-colors",
                  run.isDemoIncident
                    ? "bg-rose-50/70 ring-1 ring-inset ring-rose-200"
                    : "hover:bg-slate-50/80"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    {run.isDemoIncident ? (
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger"
                        aria-hidden
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] font-medium text-foreground">
                        {run.fundId}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {run.fundName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-foreground">{run.methodology}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {run.process}
                  </p>
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                  {run.region}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground lg:table-cell">
                  {run.creationUnit.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <CalculationBadge status={run.calculationStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3">
                  {run.status === "Failed" ? (
                    <div className="flex items-center gap-1.5">
                      <Button type="button" variant="outline" size="xs">
                        View details
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        onClick={() =>
                          openCopilot(
                            {
                              fundId: run.fundId,
                              processingDate: PROCESSING_DATE,
                            },
                            `Why did ${run.fundId} fail today?`
                          )
                        }
                      >
                        <Sparkles className="size-3" aria-hidden />
                        Ask Agent10
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`More actions for ${run.fundId}`}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
