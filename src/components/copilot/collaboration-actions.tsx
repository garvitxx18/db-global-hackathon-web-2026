"use client";

import { useState, type FormEvent } from "react";
import { Handshake, MessageSquarePlus, Users } from "lucide-react";
import {
  SUPPORT_TEAM_NAME,
  TEAMS_CHANNEL,
} from "@/lib/constants";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CollaborationActions() {
  const {
    collaborationMode,
    setCollaborationMode,
    submitOpinion,
    askSupport,
    connectTeams,
    isAnalyzing,
  } = useCopilot();
  const [text, setText] = useState("");

  function closePanel() {
    setText("");
    setCollaborationMode("idle");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (collaborationMode === "opinion") {
      submitOpinion(text);
    } else if (collaborationMode === "support") {
      askSupport(text);
    }
    setText("");
  }

  return (
    <div className="border-t border-border bg-slate-50/80 px-3 py-2">
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant={collaborationMode === "opinion" ? "default" : "outline"}
          size="xs"
          disabled={isAnalyzing}
          className="bg-surface"
          onClick={() =>
            setCollaborationMode(
              collaborationMode === "opinion" ? "idle" : "opinion"
            )
          }
        >
          <MessageSquarePlus className="size-3" aria-hidden />
          Suggest opinion
        </Button>
        <Button
          type="button"
          variant={collaborationMode === "support" ? "default" : "outline"}
          size="xs"
          disabled={isAnalyzing}
          className="bg-surface"
          onClick={() =>
            setCollaborationMode(
              collaborationMode === "support" ? "idle" : "support"
            )
          }
        >
          <Handshake className="size-3" aria-hidden />
          Ask support
        </Button>
        <Button
          type="button"
          variant={collaborationMode === "teams" ? "default" : "outline"}
          size="xs"
          disabled={isAnalyzing}
          className="bg-surface"
          onClick={() =>
            setCollaborationMode(
              collaborationMode === "teams" ? "idle" : "teams"
            )
          }
        >
          <Users className="size-3" aria-hidden />
          Connect on Teams
        </Button>
      </div>

      {collaborationMode === "opinion" || collaborationMode === "support" ? (
        <form
          onSubmit={onSubmit}
          className="mt-2 space-y-2 rounded-lg border border-border bg-surface p-2.5 shadow-sm"
        >
          <p className="text-[11px] text-muted-foreground">
            {collaborationMode === "opinion"
              ? "Share an opinion for this incident thread. Demo only — not sent externally."
              : `Ask ${SUPPORT_TEAM_NAME}. Demo replies are simulated.`}
          </p>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            placeholder={
              collaborationMode === "opinion"
                ? "e.g. Likely a stale constituent cache — check IDS before re-run"
                : "e.g. Can someone confirm the constituent load window for EMEA?"
            }
            aria-label={
              collaborationMode === "opinion"
                ? "Suggest an opinion"
                : "Ask support a question"
            }
            className="min-h-[64px] resize-none text-sm"
          />
          <div className="flex items-center justify-end gap-1.5">
            <Button type="button" variant="ghost" size="xs" onClick={closePanel}>
              Cancel
            </Button>
            <Button type="submit" size="xs" disabled={!text.trim()}>
              {collaborationMode === "opinion" ? "Attach opinion" : "Send to support"}
            </Button>
          </div>
        </form>
      ) : null}

      {collaborationMode === "teams" ? (
        <div
          className={cn(
            "mt-2 space-y-2 rounded-lg border border-border bg-surface p-2.5 shadow-sm"
          )}
        >
          <p className="text-xs font-medium text-foreground">
            Connect with support on Teams
          </p>
          <p className="text-[11px] text-muted-foreground">
            Channel:{" "}
            <span className="font-medium text-foreground">{TEAMS_CHANNEL}</span>
            <span className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
              Demo
            </span>
          </p>
          <div className="flex items-center justify-end gap-1.5">
            <Button type="button" variant="ghost" size="xs" onClick={closePanel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => {
                connectTeams();
              }}
            >
              Open Teams link
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
