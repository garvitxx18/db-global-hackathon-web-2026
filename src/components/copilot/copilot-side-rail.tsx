"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import {
  Headset,
  History,
  Plus,
  Puzzle,
  Server,
  Shield,
  Waypoints,
} from "lucide-react";
import { isDbPlugin } from "@/data/plugins";
import { PLUGIN_LOGO_SRC } from "@/lib/plugin-logos";
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

const pluginFallbackIcons: Partial<
  Record<PluginId, ComponentType<{ className?: string }>>
> = {
  "db-unity": Shield,
  "db-support-plus": Headset,
};

function PluginLogo({ pluginId, name }: { pluginId: PluginId; name: string }) {
  const logoSrc = PLUGIN_LOGO_SRC[pluginId];
  const FallbackIcon = pluginFallbackIcons[pluginId] ?? Waypoints;

  if (logoSrc) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md">
        <Image
          src={logoSrc}
          alt={`${name} logo`}
          width={24}
          height={24}
          className="size-6 object-contain"
        />
      </span>
    );
  }

  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 ring-1 ring-border">
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
      <li key={plugin.id} className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <PluginLogo pluginId={plugin.id} name={plugin.name} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium leading-4 text-foreground">
              {plugin.name}
            </p>
            <p
              className={cn(
                "mt-0.5 truncate text-[10.5px] leading-4",
                pluginStatusTone(plugin)
              )}
            >
              {plugin.status === "pending"
                ? `Pending · ${plugin.ownerTeam}`
                : pluginStatusLabel(plugin)}
            </p>
          </div>

          <div className="flex h-6 w-[72px] shrink-0 items-center">
            {plugin.status === "connected" ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                aria-pressed={plugin.selected}
                title={
                  plugin.selected
                    ? "Selected for answers"
                    : "Not used in answers"
                }
                className={cn(
                  "h-6 w-full px-0 text-[10px] font-medium",
                  plugin.selected &&
                    "border-primary/30 bg-accent text-foreground"
                )}
                onClick={() => togglePluginSelected(plugin.id)}
              >
                {plugin.selected ? "Using" : "Use"}
              </Button>
            ) : null}

            {plugin.status === "config_required" ||
            plugin.status === "available" ? (
              <Button
                type="button"
                size="xs"
                variant={
                  plugin.status === "available" && !dbBlocked
                    ? "default"
                    : "outline"
                }
                className="h-6 w-full px-0 text-[10px] font-medium"
                onClick={() => requestPluginEnable(plugin.id)}
              >
                {plugin.status === "config_required"
                  ? "Config"
                  : dbBlocked
                    ? "Connect"
                    : "Enable"}
              </Button>
            ) : null}

            {plugin.status === "pending" ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled
                className="h-6 w-full px-0 text-[10px] font-medium disabled:opacity-70"
              >
                Wait
              </Button>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-slate-50/80 sm:w-[280px]">
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
              Prod telemetry
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
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[13px] font-medium text-foreground">
              {connectedCount}/{totalPluginCount} plugins active
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {selectedCount} used for answers · PROD
            </p>
          </div>

          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="px-3 pb-1 pt-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Active plugins
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {corePlugins.map(renderPluginRow)}
            </ul>

            <div className="mt-1 border-t border-border px-3 pb-1 pt-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                DB services
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
