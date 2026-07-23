"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import {
  ANALYSIS_DURATION_MS,
  ANALYSIS_PLUGIN_STEP_MS,
  ANALYSIS_STEP_MIN_MS,
} from "@/lib/constants";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { cn } from "@/lib/utils";

const BASE_STEPS = [
  "Checking publishing run",
  "Reviewing business rules",
  "Mapping affected funds",
] as const;

export function AnalysisProgress() {
  const { analysisSteps, plugins } = useCopilot();
  const steps = useMemo(
    () => (analysisSteps.length > 0 ? analysisSteps : [...BASE_STEPS]),
    [analysisSteps]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedPluginCount = useMemo(
    () =>
      plugins.filter(
        (plugin) => plugin.status === "connected" && plugin.selected
      ).length,
    [plugins]
  );

  useEffect(() => {
    if (steps.length <= 1) return;

    const totalMs =
      ANALYSIS_DURATION_MS + selectedPluginCount * ANALYSIS_PLUGIN_STEP_MS;
    // Keep the last step visible briefly before the answer arrives.
    const stepMs = Math.max(
      ANALYSIS_STEP_MIN_MS,
      Math.floor((totalMs * 0.88) / steps.length)
    );

    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= steps.length - 1) {
          window.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [steps, selectedPluginCount]);

  return (
    <div
      className="rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3.5 text-sm shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-ai-accent" />
        <span className="font-medium text-foreground">Thinking…</span>
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          return (
            <li
              key={step}
              className={cn(
                "flex items-start gap-2.5 text-[13px] leading-snug transition-opacity",
                done && "text-success",
                current && "font-medium text-foreground",
                !done && !current && "text-muted-foreground/70"
              )}
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="size-3.5" aria-hidden />
                ) : current ? (
                  <LoaderCircle
                    className="size-3.5 animate-spin text-ai-accent"
                    aria-hidden
                  />
                ) : (
                  <span
                    className="size-1.5 rounded-full bg-border"
                    aria-hidden
                  />
                )}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
