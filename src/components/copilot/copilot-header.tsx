"use client";

import { Eraser, X } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/constants";
import { DeutscheBankMark } from "@/components/brand/deutsche-bank-mark";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopilotHeader({
  onRequestClose,
}: {
  onRequestClose?: () => void;
}) {
  const { closeCopilot, clearConversation, activeIncidentId } = useCopilot();

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-border px-3 pl-12 sm:pl-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <DeutscheBankMark className="rounded-sm" size={28} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-semibold leading-tight text-foreground">
              {PRODUCT_NAME}
            </h2>
            <span
              className="hidden size-1.5 shrink-0 rounded-full bg-success sm:inline-block"
              title="Demo data — not a live production connection"
              aria-label="Demo connected status"
            />
          </div>
          <p className="truncate font-mono text-[11px] leading-tight text-muted-foreground">
            {activeIncidentId}
            <span className="ml-1.5 rounded bg-slate-100 px-1 py-px text-[9px] font-sans font-medium uppercase tracking-wide text-slate-600">
              Demo
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Clear conversation"
                onClick={clearConversation}
              />
            }
          >
            <Eraser className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Clear conversation</TooltipContent>
        </Tooltip>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Close ${PRODUCT_NAME}`}
          onClick={onRequestClose ?? closeCopilot}
        >
          <X className="size-4" />
        </Button>
      </div>
    </header>
  );
}
