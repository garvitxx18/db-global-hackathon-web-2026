"use client";

import { Bell, Search } from "lucide-react";
import { ENVIRONMENT } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopBar({ lastRefresh }: { lastRefresh: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="min-w-0 pl-10 lg:pl-0">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex items-center gap-1.5">
            <li>Operations</li>
            <li aria-hidden className="text-border">
              /
            </li>
            <li className="truncate font-medium text-foreground">PCF Generation</li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Badge
          variant="outline"
          className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex"
        >
          <span
            className="mr-1.5 size-1.5 rounded-full bg-success"
            aria-hidden
          />
          {ENVIRONMENT}
          <span className="sr-only">environment</span>
        </Badge>

        <p className="hidden text-xs text-muted-foreground md:block">
          Last refresh{" "}
          <time className="font-mono text-foreground" dateTime={lastRefresh}>
            {lastRefresh}
          </time>
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Search PCFs and calculation runs"
        >
          <Search className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications, 1 unread"
        >
          <Bell className="size-4" />
          <span
            className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger"
            aria-hidden
          />
        </Button>

        <div
          className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white"
          aria-label="Signed in as DS"
          title="DS"
        >
          DS
        </div>
      </div>
    </header>
  );
}
