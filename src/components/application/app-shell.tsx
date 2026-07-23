"use client";

import { RefreshCw } from "lucide-react";
import { dashboardSummary, publishingRuns } from "@/data/funds";
import {
  DASHBOARD_SUBTITLE,
  DASHBOARD_TITLE,
  PROCESSING_DATE,
} from "@/lib/constants";
import { IncidentStrip } from "@/components/application/incident-strip";
import { PublishingRunsTable } from "@/components/application/publishing-runs-table";
import { Sidebar } from "@/components/application/sidebar";
import { SummaryCards } from "@/components/application/summary-cards";
import { TopBar } from "@/components/application/top-bar";
import { Button } from "@/components/ui/button";

export function AppShell({ lastRefresh }: { lastRefresh: string }) {
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar lastRefresh={lastRefresh} />

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {DASHBOARD_TITLE}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {DASHBOARD_SUBTITLE}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                  <span>Processing date</span>
                  <span className="font-mono text-foreground">
                    {PROCESSING_DATE}
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                  <span>Region</span>
                  <span className="font-medium text-foreground">All regions</span>
                </label>
                <Button type="button" variant="outline" size="sm">
                  <RefreshCw className="size-3.5" aria-hidden />
                  Refresh
                </Button>
              </div>
            </div>

            <SummaryCards summary={dashboardSummary} />
            <IncidentStrip />
            <PublishingRunsTable runs={publishingRuns} />
          </div>
        </main>
      </div>
    </div>
  );
}
