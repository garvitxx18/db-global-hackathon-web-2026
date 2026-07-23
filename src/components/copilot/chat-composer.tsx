"use client";

import { useEffect, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { COMPOSER_PLACEHOLDERS } from "@/lib/constants";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function ChatComposer() {
  const { ask, isAnalyzing, composerRef, draft, setDraft } = useCopilot();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (draft.trim()) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % COMPOSER_PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [draft]);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  }, [draft, composerRef]);

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || isAnalyzing) return;
    await ask(question);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="border-t border-border bg-surface px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-app-bg px-1.5 py-1 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/15">
        <Textarea
          ref={composerRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isAnalyzing}
          rows={1}
          placeholder={COMPOSER_PLACEHOLDERS[placeholderIndex]}
          aria-label="Ask Agent10"
          className="min-h-[32px] max-h-[88px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-5 shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={isAnalyzing || !draft.trim()}
          aria-label="Send message"
          className="shrink-0"
        >
          <SendHorizontal className="size-3.5" />
        </Button>
      </div>
      <p className="mt-1 px-1 text-[10px] text-muted-foreground">
        AI-generated analysis · Verify before acting
      </p>
    </form>
  );
}
