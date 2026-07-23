"use client";

import { MoreHorizontal, Sparkles } from "lucide-react";
import type { PublishingRun, PublishingStatus } from "@/types/incidents";
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

export function PublishingRunsTable({ runs }: { runs: PublishingRun[] }) {
  const { openCopilot } = useCopilot();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Publishing runs
          </h2>
          <p className="text-xs text-muted-foreground">
            Current processing window · {PROCESSING_DATE}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Fund / ISIN</th>
              <th className="px-4 py-2.5 font-medium">Process</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                Region
              </th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                Scheduled
              </th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                Completed
              </th>
              <th className="px-4 py-2.5 font-medium">Status</th>
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
                  <div className="flex items-center gap-2">
                    {run.isDemoIncident ? (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-danger"
                        aria-hidden
                      />
                    ) : null}
                    <span className="font-mono text-[13px] font-medium text-foreground">
                      {run.fundId}
                    </span>
                    {run.isDemoIncident ? (
                      <span className="sr-only">Demo incident selected</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">{run.process}</td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                  {run.region}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground lg:table-cell">
                  {run.scheduled}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground lg:table-cell">
                  {run.completed ?? "—"}
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
