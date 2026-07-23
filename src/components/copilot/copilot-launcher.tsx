"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PRODUCT_NAME } from "@/lib/constants";
import { DeutscheBankMark } from "@/components/brand/deutsche-bank-mark";
import { useCopilot } from "@/components/copilot/copilot-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function CopilotLauncher() {
  const {
    isOpen,
    openCopilot,
    helperLabelDismissed,
    hasFailedIncident,
    launcherRef,
  } = useCopilot();
  const reduceMotion = useReducedMotion();

  if (isOpen) return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-3 sm:right-6">
      <AnimatePresence>
        {!helperLabelDismissed ? (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
            className="pointer-events-none hidden rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:block"
          >
            Ask why something failed
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-auto relative">
        {hasFailedIncident ? (
          <span
            className={cn(
              "absolute inset-0 rounded-full border-2 border-[#0018A8]/35",
              !reduceMotion && "animate-ping opacity-40"
            )}
            aria-hidden
          />
        ) : null}

        <Tooltip>
          <TooltipTrigger
            ref={launcherRef}
            type="button"
            aria-label={`Ask ${PRODUCT_NAME}`}
            onClick={() => openCopilot()}
            className="relative flex size-[52px] items-center justify-center overflow-hidden rounded-full bg-white shadow-lg outline-none ring-1 ring-border ring-offset-2 transition hover:brightness-105 focus-visible:ring-3 focus-visible:ring-[#0018A8]/40 sm:size-14"
          >
            <DeutscheBankMark className="size-8 sm:size-9" size={36} />
          </TooltipTrigger>
          <TooltipContent side="left">Ask {PRODUCT_NAME}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
