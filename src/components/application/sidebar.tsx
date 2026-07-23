"use client";

import { useState } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  ChevronLeft,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  X,
} from "lucide-react";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const iconMap = {
  overview: LayoutDashboard,
  "fund-publishing": Building2,
  "pcf-generation": FileSpreadsheet,
  "nav-validation": Activity,
  "data-loads": Database,
  incidents: ShieldAlert,
  runbooks: BookOpen,
} as const;

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed left-3 top-3 z-40 lg:hidden bg-surface shadow-sm"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          collapsed ? "w-[72px]" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          <div className={cn("min-w-0", collapsed && "lg:hidden")}>
            <p className="truncate text-sm font-semibold tracking-tight text-white">
              PCF Generation
            </p>
            <p className="truncate text-[11px] text-[color:var(--sidebar-muted)]">
              Operations Console
            </p>
          </div>
          {collapsed ? (
            <span className="hidden text-xs font-semibold text-ai-accent lg:inline">
              PCF
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden text-sidebar-muted hover:bg-sidebar-accent hover:text-white lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            <ChevronLeft
              className={cn("size-4 transition-transform", collapsed && "rotate-180")}
            />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2" aria-label="Primary">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = iconMap[item.id as keyof typeof iconMap];
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.active}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  item.active
                    ? "bg-sidebar-accent text-white"
                    : "text-[color:var(--sidebar-muted)] hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  !item.active && "cursor-default opacity-70"
                )}
                title={item.label}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                {item.active ? (
                  <span className="sr-only">(current)</span>
                ) : (
                  <span className="sr-only">(unavailable in demo)</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p
            className={cn(
              "text-[11px] leading-relaxed text-[color:var(--sidebar-muted)]",
              collapsed && "lg:hidden"
            )}
          >
            Demo application shell · mock data only
          </p>
        </div>
      </aside>
    </>
  );
}
