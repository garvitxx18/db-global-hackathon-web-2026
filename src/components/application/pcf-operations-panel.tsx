import {
  ArrowRightLeft,
  Boxes,
  Calculator,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { DEMO_FUND_ID, PROCESSING_DATE } from "@/lib/constants";

const waterfallSteps = [
  {
    id: "abor",
    label: "T−1 ABOR close",
    detail: "Official positions, cash, accruals",
  },
  {
    id: "trades",
    label: "Trades & orders",
    detail: "Booked activity + eligible unbooked orders",
  },
  {
    id: "ca",
    label: "Corporate actions",
    detail: "Effective-on-T quantity & identity adjusts",
  },
  {
    id: "index",
    label: "Index / synthetic",
    detail: "Constituents, weights, reference data",
  },
  {
    id: "scale",
    label: "Scale & round",
    detail: "Creation-unit scaling + residual cash",
  },
  {
    id: "publish",
    label: "Validate & publish",
    detail: "NAV controls → PCF snapshot",
  },
] as const;

const dataDomains = [
  { name: "ABOR", use: "Opening portfolio state" },
  { name: "Index", use: "Synthetic / target basket" },
  { name: "Security master", use: "ISIN, FX, multipliers" },
  { name: "NAV / NOSH", use: "Basket valuation & CU size" },
  { name: "FX & hedges", use: "Base conversion / forwards" },
  { name: "Fees & accruals", use: "Cash balancing" },
] as const;

export function PcfOperationsPanel() {
  return (
    <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 p-1.5 text-slate-700">
                <Calculator className="size-3.5" aria-hidden />
              </span>
              <h2 className="text-sm font-semibold text-foreground">
                PCF calculation waterfall
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Canonical T−1 → T path for synthetic fund basket publication ·{" "}
              {PROCESSING_DATE}
            </p>
          </div>
          <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
            Blocked at index load
          </span>
        </div>

        <ol className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
          {waterfallSteps.map((step, index) => {
            const state =
              step.id === "index"
                ? "blocked"
                : step.id === "scale" || step.id === "publish"
                  ? "pending"
                  : "done";
            return (
              <li
                key={step.id}
                className="relative border-b border-border/70 px-4 py-3 sm:border-r sm:odd:border-r xl:[&:nth-child(3n)]:border-r-0"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={
                      state === "blocked"
                        ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-semibold text-rose-700"
                        : state === "done"
                          ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700"
                          : "flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500"
                    }
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="rounded-md bg-slate-100 p-1.5 text-slate-700">
              <Boxes className="size-3.5" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Synthetic PCF inputs
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Primary data domains feeding today&apos;s run
              </p>
            </div>
          </div>
          <ul className="divide-y divide-border/70">
            {dataDomains.map((domain) => (
              <li
                key={domain.name}
                className="flex items-center justify-between gap-3 px-4 py-2"
              >
                <span className="text-[12px] font-medium text-foreground">
                  {domain.name}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {domain.use}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="rounded-md bg-slate-100 p-1.5 text-slate-700">
              <FileSpreadsheet className="size-3.5" aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Focus fund · {DEMO_FUND_ID}
            </h2>
          </div>
          <div className="space-y-2.5 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
            <p>
              Synthetic basket methodology expects index constituents + weights
              before scaling to creation-unit exposure.
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-amber-950">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden />
              <p>
                Control: do not run PCF calculation before constituent-load
                completion. Empty IDS payload blocked{" "}
                <span className="font-mono font-medium">securityDetails</span>{" "}
                resolution.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ArrowRightLeft className="size-3" aria-hidden />
              Next: re-ingest index daily → re-run synthetic PCF job
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
