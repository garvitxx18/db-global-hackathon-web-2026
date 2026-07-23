"use client";

import type { ChatMessage } from "@/types/copilot";
import { SourcesUsed } from "@/components/copilot/sources-used";
import { cn } from "@/lib/utils";

function TextBlock({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap">{text}</p>;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const sources = message.role === "assistant" ? message.sources : undefined;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-surface text-foreground"
        )}
      >
        {message.role === "assistant" && message.analysis ? (
          <div className="space-y-2.5">
            <TextBlock text={message.content ?? message.analysis.summary} />
            <p className="rounded-lg border border-dashed border-border bg-slate-50 px-2.5 py-2 text-xs text-muted-foreground">
              Full incident analysis cards (root cause, evidence, Jira draft)
              arrive in the next milestone. Summary and typed analysis payload
              are already available.
            </p>
            {sources ? <SourcesUsed sources={sources} /> : null}
          </div>
        ) : message.role === "assistant" && message.affectedFunds ? (
          <div className="space-y-2.5">
            {message.content ? <TextBlock text={message.content} /> : null}
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
            {sources ? <SourcesUsed sources={sources} /> : null}
          </div>
        ) : (
          <div className="space-y-2.5">
            {message.content ? <TextBlock text={message.content} /> : null}
            {sources ? <SourcesUsed sources={sources} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
