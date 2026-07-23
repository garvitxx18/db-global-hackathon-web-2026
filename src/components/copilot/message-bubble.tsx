"use client";

import { Handshake, Lightbulb, MessageSquareText } from "lucide-react";
import type { ChatMessage } from "@/types/copilot";
import { MarkdownContent } from "@/components/copilot/markdown-content";
import { SourcesUsed } from "@/components/copilot/sources-used";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const kind = message.kind ?? "message";
  const sources = message.role === "assistant" ? message.sources : undefined;
  const content =
    message.role === "assistant"
      ? message.content ?? message.analysis?.summary
      : message.content;

  if (isUser && kind === "opinion") {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[92%] overflow-hidden rounded-2xl rounded-br-md border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/70 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-amber-200/70 bg-amber-100/50 px-3 py-1.5">
            <Lightbulb className="size-3.5 text-amber-700" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Opinion attached
            </span>
          </div>
          <div className="px-3.5 py-2.5">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-amber-950">
              {content}
            </p>
            <p className="mt-1.5 text-[10px] text-amber-800/70">
              Visible to support & engineering review · Demo only
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isUser && kind === "support") {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[92%] overflow-hidden rounded-2xl rounded-br-md border border-sky-200/80 bg-gradient-to-br from-sky-50 to-blue-50/70 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-sky-200/70 bg-sky-100/50 px-3 py-1.5">
            <Handshake className="size-3.5 text-sky-700" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-900">
              Support request
            </span>
          </div>
          <div className="px-3.5 py-2.5">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-sky-950">
              {content}
            </p>
            <p className="mt-1.5 text-[10px] text-sky-800/70">
              Routed to ETF Operations Support · Demo
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUser && kind === "ack") {
    return (
      <div className="flex w-full justify-start">
        <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-dashed border-slate-300 bg-slate-50/90 px-3.5 py-2.5 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-slate-500">
            <MessageSquareText className="size-3.5" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Thread note
            </span>
          </div>
          {content ? (
            <p className="text-[12.5px] leading-relaxed text-slate-600">
              {content}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[94%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-surface text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
            {content}
          </p>
        ) : (
          <div className="space-y-2">
            {content ? <MarkdownContent content={content} /> : null}

            {message.role === "assistant" && message.analysis ? (
              <p className="rounded-lg border border-dashed border-border bg-slate-50 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
                Full incident analysis cards (root cause, evidence, Jira draft)
                arrive in the next milestone. Summary and typed analysis payload
                are already available.
              </p>
            ) : null}

            {message.role === "assistant" && message.affectedFunds ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">ISIN</th>
                      <th className="px-2 py-1.5 font-medium">Status</th>
                      <th className="px-2 py-1.5 font-medium">Dependency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {message.affectedFunds.map((fund) => (
                      <tr key={fund.fundId} className="border-t border-border">
                        <td className="px-2 py-1.5 font-mono">{fund.fundId}</td>
                        <td className="px-2 py-1.5 text-warning">{fund.status}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {fund.dependency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {sources ? <SourcesUsed sources={sources} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
