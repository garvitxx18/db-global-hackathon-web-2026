"use client";

import { useEffect, useRef } from "react";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { AnalysisProgress } from "@/components/copilot/analysis-progress";
import { MessageBubble } from "@/components/copilot/message-bubble";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Conversation() {
  const { messages, isAnalyzing, ask, context, analysisSteps } = useCopilot();
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const viewport = viewportRef.current?.querySelector(
      "[data-slot='scroll-area-viewport']"
    ) as HTMLElement | null;

    if (!viewport) return;

    const onScroll = () => {
      const distance =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      stickToBottom.current = distance < 80;
    };

    viewport.addEventListener("scroll", onScroll);
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isAnalyzing]);

  const showChips =
    messages.length <= 1 && !isAnalyzing && !messages.some((m) => m.role === "user");

  return (
    <div className="flex min-h-0 flex-1 flex-col" ref={viewportRef}>
      {context?.fundId ? (
        <div className="border-b border-border bg-slate-50 px-4 py-2">
          <ContextBar />
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1 px-4">
        <div
          className="flex flex-col gap-3 py-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isAnalyzing ? (
            <AnalysisProgress key={analysisSteps.join("|") || "analyzing"} />
          ) : null}

          {showChips ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal rounded-full px-3 py-1.5 text-left text-xs"
                  onClick={() => void ask(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

function ContextBar() {
  const { context, removeContext } = useCopilot();
  if (!context?.fundId) return null;

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <p className="min-w-0 text-muted-foreground">
        Context:{" "}
        <span className="font-mono font-medium text-foreground">
          {context.fundId}
        </span>
        {context.processingDate ? (
          <>
            {" · "}
            <span className="font-mono text-foreground">
              {context.processingDate}
            </span>
          </>
        ) : null}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-label="Remove fund context"
        onClick={removeContext}
      >
        Remove
      </Button>
    </div>
  );
}
