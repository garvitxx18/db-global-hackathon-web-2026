"use client";

import Image from "next/image";
import { getPluginLogoSrc } from "@/lib/plugin-logos";
import type { PluginId } from "@/types/copilot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface MessageSource {
  id: PluginId;
  name: string;
}

export function SourcesUsed({ sources }: { sources: MessageSource[] }) {
  if (sources.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground">App context only</p>
    );
  }

  const countLabel =
    sources.length === 1 ? "1 source" : `${sources.length} sources`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {sources.map((source, index) => {
          const logoSrc = getPluginLogoSrc(source.id);
          return (
            <Tooltip key={source.id}>
              <TooltipTrigger
                className={cn(
                  "relative inline-flex size-[22px] items-center justify-center overflow-hidden rounded-full bg-white",
                  "ring-2 ring-white shadow-[0_0_0_1px_rgba(15,23,42,0.1)]",
                  index > 0 && "-ml-2"
                )}
                style={{ zIndex: index + 1 }}
                aria-label={source.name}
              >
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 object-contain"
                  />
                ) : (
                  <span className="text-[9px] font-semibold text-slate-600">
                    {source.name.slice(0, 1)}
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent side="top">{source.name}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <span className="text-[12px] text-muted-foreground">{countLabel}</span>
    </div>
  );
}
