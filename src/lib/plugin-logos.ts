import type { PluginId } from "@/types/copilot";

export const PLUGIN_LOGO_SRC: Partial<Record<PluginId, string>> = {
  teams: "/brand/plugins/teams.png",
  gcp: "/brand/plugins/gcp.png",
  jira: "/brand/plugins/jira.png",
  confluence: "/brand/plugins/confluence.png",
  openshift: "/brand/plugins/openshift.png",
  scribe: "/brand/plugins/scribe.png",
  github: "/brand/plugins/github.png",
  "new-relic": "/brand/plugins/new-relic.png",
};

export function getPluginLogoSrc(pluginId: PluginId): string | undefined {
  return PLUGIN_LOGO_SRC[pluginId];
}
