"use client";

import { CopilotLauncher } from "@/components/copilot/copilot-launcher";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { CopilotProvider } from "@/components/copilot/copilot-provider";
import { AppShell } from "@/components/application/app-shell";

export function HomeClient({ lastRefresh }: { lastRefresh: string }) {
  return (
    <CopilotProvider hasFailedIncident>
      <AppShell lastRefresh={lastRefresh} />
      <CopilotLauncher />
      <CopilotPanel />
    </CopilotProvider>
  );
}
