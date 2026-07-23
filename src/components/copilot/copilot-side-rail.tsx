"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import {
  Bell,
  Headset,
  History,
  Plus,
  Puzzle,
  Server,
  Shield,
  Waypoints,
} from "lucide-react";
import { isDbPlugin } from "@/data/plugins";
import { useCopilot } from "@/components/copilot/copilot-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
  ChatSession,
  CopilotPlugin,
  PluginId,
  ServiceHealth,
} from "@/types/copilot";

function statusLabel(status: ChatSession["status"]) {
  switch (status) {
    case "investigating":
      return "Investigating";
    case "resolved":
      return "Resolved";
    default:
      return "Open";
  }
}

function statusTone(status: ChatSession["status"]) {
  switch (status) {
    case "investigating":
      return "text-warning";
    case "resolved":
      return "text-success";
    default:
      return "text-primary";
  }
}

function healthTone(health: ServiceHealth) {
  switch (health) {
    case "healthy":
      return "bg-success";
    case "degraded":
      return "bg-warning";
    default:
      return "bg-danger";
  }
}

function healthLabel(health: ServiceHealth) {
  switch (health) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    default:
      return "Down";
  }
}

const pluginLogoSrc: Partial<Record<PluginId, string>> = {
  teams: "/brand/plugins/teams.png",
  gcp: "/brand/plugins/gcp.png",
  jira: "/brand/plugins/jira.png",
  confluence: "/brand/plugins/confluence.png",
  openshift: "/brand/plugins/openshift.png",
  scribe: "/brand/plugins/scribe.png",
};

const pluginFallbackIcons: Partial<
  Record<PluginId, ComponentType<{ className?: string }>>
> = {
  "db-omni": Waypoints,
  "db-unity": Shield,
  "db-support-plus": Headset,
  "db-notifier": Bell,
};

function PluginLogo({ pluginId, name }: { pluginId: PluginId; name: string }) {
  const logoSrc = pluginLogoSrc[pluginId];
  const FallbackIcon = pluginFallbackIcons[pluginId] ?? Waypoints;

  if (logoSrc) {
    return (
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
        <Image
          src={logoSrc}
          alt={`${name} logo`}
          width={28}
          height={28}
          className="size-7 object-contain"
        />
      </span>
    );
  }

  return (
    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 ring-1 ring-border">
      <FallbackIcon className="size-3.5" aria-hidden />
    </span>
  );
}

function pluginStatusLabel(plugin: CopilotPlugin) {
  switch (plugin.status) {
    case "connected":
      return "Connected";
    case "config_required":
      return "Config needed";
    case "pending":
      return "Pending";
    default:
      return "Off";
  }
}

function pluginStatusTone(plugin: CopilotPlugin) {
  switch (plugin.status) {
    case "connected":
      return "text-success";
    case "config_required":
      return "text-warning";
    case "pending":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
}

export function CopilotSideRail() {
  const {
    sideTab,
    setSideTab,
    sessions,
    activeSessionId,
    selectSession,
    startNewChat,
    serviceStatus,
    plugins,
    togglePluginSelected,
    requestPluginEnable,
  } = useCopilot();

  const connectedCount = plugins.filter((p) => p.status === "connected").length;
  const totalPluginCount = plugins.length;
  const selectedCount = plugins.filter(
    (p) => p.status === "connected" && p.selected
  ).length;
  const corePlugins = plugins.filter((plugin) => !isDbPlugin(plugin.id));
  const dbPlugins = plugins.filter((plugin) => isDbPlugin(plugin.id));

  function renderPluginRow(plugin: CopilotPlugin) {
    const dbBlocked = isDbPlugin(plugin.id);

    return (
      <li key={plugin.id} className="px-3 py-3">
        <div className="flex items-start gap-2.5">
          <PluginLogo pluginId={plugin.id} name={plugin.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-medium text-foreground">
                {plugin.name}
              </p>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-medium",
                  pluginStatusTone(plugin)
                )}
              >
                {pluginStatusLabel(plugin)}
              </span>
            </div>

            {plugin.status === "connected" ? (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={plugin.selected}
                  onChange={() => togglePluginSelected(plugin.id)}
                />
                Use in answers
              </label>
            ) : null}

            {plugin.status === "config_required" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-7 w-full bg-white text-xs"
                onClick={() => requestPluginEnable(plugin.id)}
              >
                Request config
              </Button>
            ) : null}

            {plugin.status === "available" ? (
              <Button
                type="button"
                size="sm"
                variant={dbBlocked ? "outline" : "default"}
                className="mt-2 h-7 w-full text-xs"
                onClick={() => requestPluginEnable(plugin.id)}
              >
                {dbBlocked ? "Connect" : "Enable"}
              </Button>
            ) : null}

            {plugin.status === "pending" ? (
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                Waiting on {plugin.ownerTeam}
              </p>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-border bg-slate-50/80 sm:w-[228px]">
      <div
        role="tablist"
        aria-label="Copilot side panels"
        className="flex h-[60px] shrink-0 items-center gap-0.5 border-b border-border px-2"
      >
        {(
          [
            { id: "chats" as const, label: "Chats", icon: History },
            { id: "services" as const, label: "Services", icon: Server },
            { id: "plugins" as const, label: "Plugins", icon: Puzzle },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const selected = sideTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              title={tab.label}
              className={cn(
                "flex h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors",
                selected
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
              )}
              onClick={() => setSideTab(tab.id)}
            >
              <Icon className="size-3.5" aria-hidden />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {sideTab === "chats" ? (
        <div className="flex min-h-0 flex-1 flex-col" role="tabpanel">
          <div className="p-3 pb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center bg-surface"
              onClick={startNewChat}
            >
              <Plus className="size-3.5" aria-hidden />
              New chat
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <ul className="space-y-0.5 px-2 pb-3">
              {sessions.map((session) => {
                const active = session.id === activeSessionId;
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => selectSession(session.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                        active
                          ? "bg-white shadow-sm ring-1 ring-border"
                          : "hover:bg-white/80"
                      )}
                      aria-current={active ? "true" : undefined}
                    >
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {session.title}
                      </p>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {session.incidentId}
                      </p>
                      <p
                        className={cn(
                          "mt-1.5 text-[11px] font-medium",
                          statusTone(session.status)
                        )}
                      >
                        {statusLabel(session.status)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </div>
      ) : null}

      {sideTab === "services" ? (
        <div className="flex min-h-0 flex-1 flex-col" role="tabpanel">
          <div className="space-y-1 border-b border-border px-3 py-3">
            <p className="text-[13px] font-medium text-foreground">
              {serviceStatus.totalServices} services
            </p>
            <p className="text-[12px] text-muted-foreground">
              {serviceStatus.totalPodsRunning}/{serviceStatus.totalPodsDesired}{" "}
              pods · {serviceStatus.healthyServices} healthy ·{" "}
              {serviceStatus.degradedServices} degraded
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Demo data
            </p>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <ul className="divide-y divide-border/70">
              {serviceStatus.services.map((service) => (
                <li key={service.id} className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        healthTone(service.health)
                      )}
                      aria-hidden
                    />
                    <p className="min-w-0 truncate font-mono text-[12px] font-medium text-foreground">
                      {service.name}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 pl-3.5 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">
                      {service.podsRunning}/{service.podsDesired} pods
                    </span>
                    <span>{healthLabel(service.health)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      ) : null}

      {sideTab === "plugins" ? (
        <div className="flex min-h-0 flex-1 flex-col" role="tabpanel">
          <div className="space-y-1 border-b border-border px-3 py-3">
            <p className="text-[13px] font-medium text-foreground">
              {connectedCount}/{totalPluginCount} plugins active
            </p>
            <p className="text-[12px] text-muted-foreground">
              {selectedCount} used for answers · Demo
            </p>
          </div>

          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="px-3 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Active plugins
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {corePlugins.map(renderPluginRow)}
            </ul>

            <div className="mt-1 border-t border-border px-3 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                DB services
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Not connected in this demo environment.
              </p>
            </div>
            <ul className="divide-y divide-border/60 pb-3">
              {dbPlugins.map(renderPluginRow)}
            </ul>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
