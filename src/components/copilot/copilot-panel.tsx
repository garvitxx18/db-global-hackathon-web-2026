"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PanelLeft } from "lucide-react";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { CopilotHeader } from "@/components/copilot/copilot-header";
import { CopilotSideRail } from "@/components/copilot/copilot-side-rail";
import { Conversation } from "@/components/copilot/conversation";
import { CollaborationActions } from "@/components/copilot/collaboration-actions";
import { ChatComposer } from "@/components/copilot/chat-composer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopilotPanel() {
  const {
    isOpen,
    closeCopilot,
    jiraDraftState,
    collaborationMode,
    setCollaborationMode,
  } = useCopilot();
  const reduceMotion = useReducedMotion();
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (jiraDraftState === "reviewing") return;
      if (collaborationMode !== "idle") {
        setCollaborationMode("idle");
        return;
      }
      if (mobileRailOpen) {
        setMobileRailOpen(false);
        return;
      }
      setMobileRailOpen(false);
      closeCopilot();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isOpen,
    closeCopilot,
    jiraDraftState,
    collaborationMode,
    setCollaborationMode,
    mobileRailOpen,
  ]);

  function handleClose() {
    setMobileRailOpen(false);
    closeCopilot();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close copilot backdrop"
            className="fixed inset-0 z-40 bg-slate-900/10 md:bg-slate-900/5"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={handleClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Agent10"
            className={cn(
              "fixed z-50 flex overflow-hidden border border-border bg-surface shadow-2xl",
              "inset-0 rounded-none",
              "sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[min(820px,calc(100vw-2rem))] sm:rounded-2xl",
              "md:w-[min(900px,calc(100vw-2rem))]"
            )}
            initial={
              reduceMotion ? false : { opacity: 0, x: 24, scale: 0.98 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, x: 24, scale: 0.98 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 z-20 sm:static sm:z-auto",
                mobileRailOpen ? "flex" : "hidden sm:flex"
              )}
            >
              <CopilotSideRail />
            </div>

            {mobileRailOpen ? (
              <button
                type="button"
                className="absolute inset-0 z-10 bg-slate-900/20 sm:hidden"
                aria-label="Close chats and services panel"
                onClick={() => setMobileRailOpen(false)}
              />
            ) : null}

            <div className="relative flex min-w-0 flex-1 flex-col">
              <div className="absolute left-2 top-[14px] z-10 sm:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="bg-surface shadow-sm"
                  aria-label={
                    mobileRailOpen
                      ? "Hide chats and services"
                      : "Show chats and services"
                  }
                  aria-expanded={mobileRailOpen}
                  onClick={() => setMobileRailOpen((open) => !open)}
                >
                  <PanelLeft className="size-4" />
                </Button>
              </div>
              <CopilotHeader onRequestClose={handleClose} />
              <Conversation />
              <CollaborationActions />
              <ChatComposer />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
