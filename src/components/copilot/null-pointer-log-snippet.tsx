"use client";

import { Terminal } from "lucide-react";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";

const fallbackLog = `2026-07-24T09:32:14.118Z ERROR pcf-calculation-engine
NullPointerException: securityDetails is null
at PcfCalculationService.calculate(PcfCalculationService.java:219)
correlationId=pcf-7d92a1 fundId=LU0411078552`;

export function NullPointerLogSnippet() {
  const logEvidence =
    pcfIncidentAnalysis.evidence.find((item) => item.kind === "log") ?? null;
  const lines = (logEvidence?.content ?? fallbackLog).split("\n");

  return (
    <div className="overflow-hidden rounded-lg border border-rose-200/80 bg-slate-950 text-[11px] shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-slate-900 px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-slate-300">
          <Terminal className="size-3 shrink-0 text-rose-300" aria-hidden />
          <span className="truncate font-medium">
            {logEvidence?.source ?? "pcf-calculation-engine"}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-slate-500">
          {(logEvidence?.timestamp ?? "2026-07-24T09:32:14.118Z").replace(
            "T",
            " "
          ).replace("Z", " UTC")}
        </span>
      </div>
      <pre className="overflow-x-auto px-2.5 py-2 font-mono leading-relaxed text-slate-200">
        {lines.map((line, index) => {
          const isNpe = /nullpointer/i.test(line);
          return (
            <div
              key={`${index}-${line.slice(0, 24)}`}
              className={
                isNpe
                  ? "rounded bg-rose-500/20 px-1 text-rose-200"
                  : undefined
              }
            >
              {line || " "}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
