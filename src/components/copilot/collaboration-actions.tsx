"use client";

import { useState, type FormEvent } from "react";
import { Handshake, MessageSquarePlus, Phone, Users } from "lucide-react";
import {
  SUPPORT_TEAM_NAME,
  TEAMS_CALL_CONTACTS,
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
  const [selectedContactId, setSelectedContactId] = useState<string>(
    TEAMS_CALL_CONTACTS[0]?.id ?? ""
  );

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

  const selectedContact =
    TEAMS_CALL_CONTACTS.find((contact) => contact.id === selectedContactId) ??
    TEAMS_CALL_CONTACTS[0];

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
              ? "Share an opinion for this incident thread."
              : `Ask ${SUPPORT_TEAM_NAME}.`}
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
          <div>
            <p className="text-xs font-medium text-foreground">
              Call a colleague on Teams
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Opens Microsoft Teams with a video call to the selected person.
            </p>
          </div>

          <ul className="space-y-1">
            {TEAMS_CALL_CONTACTS.map((contact) => {
              const selected = contact.id === selectedContactId;
              return (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedContactId(contact.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                      selected
                        ? "border-primary/30 bg-accent"
                        : "border-transparent hover:bg-slate-50"
                    )}
                    aria-pressed={selected}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
                      {contact.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-foreground">
                        {contact.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {contact.role} · {contact.email}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-end gap-1.5">
            <Button type="button" variant="ghost" size="xs" onClick={closePanel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="xs"
              disabled={!selectedContact}
              onClick={() => {
                if (!selectedContact) return;
                connectTeams({
                  name: selectedContact.name,
                  email: selectedContact.email,
                });
              }}
            >
              <Phone className="size-3" aria-hidden />
              Start Teams call
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
