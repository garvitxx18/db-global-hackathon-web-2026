import type { CopilotPlugin, PluginId } from "@/types/copilot";

export const DB_PLUGIN_IDS: PluginId[] = ["db-unity", "db-support-plus"];

export function isDbPlugin(pluginId: PluginId): boolean {
  return DB_PLUGIN_IDS.includes(pluginId);
}

/**
 * Plugin states:
 * - Jira, Confluence, GCP, GitHub: connected
 * - OpenShift, Teams, Scribe, New Relic: available
 * - DB suite plugins: listed last, blocked until DB suite connects
 */
export const initialPlugins: CopilotPlugin[] = [
  {
    id: "jira",
    name: "Jira",
    description: "Incident tickets and linked change history",
    status: "connected",
    selected: true,
    thinkingStep: "Checking related Jira issues and change records",
    ownerTeam: "PCF Calculation Team",
  },
  {
    id: "confluence",
    name: "Confluence",
    description: "Runbooks and knowledge articles",
    status: "connected",
    selected: true,
    thinkingStep: "Searching Confluence runbooks",
    ownerTeam: "ETF Operations",
  },
  {
    id: "gcp",
    name: "GCP",
    description: "Cloud logs, metrics, and resource telemetry",
    status: "connected",
    selected: true,
    thinkingStep: "Pulling GCP logs and metrics for the failure window",
    ownerTeam: "Cloud Platform",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repos, pipelines, and recent code changes",
    status: "connected",
    selected: true,
    thinkingStep: "Reviewing GitHub commits and CI for related services",
    ownerTeam: "PCF Calculation Team",
  },
  {
    id: "openshift",
    name: "OpenShift",
    description: "Pod events, deployments, and cluster health",
    status: "available",
    selected: false,
    thinkingStep: "Querying OpenShift pod events and rollout status",
    ownerTeam: "Platform Ops",
  },
  {
    id: "teams",
    name: "Teams",
    description: "Incident bridge channels and specialist threads",
    status: "available",
    selected: false,
    thinkingStep: "Scanning Teams incident bridge for recent updates",
    ownerTeam: "ETF Operations Support",
  },
  {
    id: "scribe",
    name: "Scribe",
    description: "Documented operational procedures",
    status: "available",
    selected: false,
    thinkingStep: "Reading Scribe operational procedures",
    ownerTeam: "Knowledge Management",
  },
  {
    id: "new-relic",
    name: "New Relic",
    description: "APM traces, errors, and service health signals",
    status: "available",
    selected: false,
    thinkingStep: "Checking New Relic APM and error traces",
    ownerTeam: "Observability",
  },
  {
    id: "db-unity",
    name: "dbUnity",
    description: "Unified identity and access context",
    status: "available",
    selected: false,
    thinkingStep: "Checking dbUnity access context for impacted services",
    ownerTeam: "Identity Platform",
  },
  {
    id: "db-support-plus",
    name: "dbSupportPlus",
    description: "Support cases and escalation workflows",
    status: "available",
    selected: false,
    thinkingStep: "Checking dbSupportPlus cases linked to this fund",
    ownerTeam: "Client Support",
  },
];

export const PLUGIN_ENABLE_REQUEST_ACK =
  "Configuration request sent to the owning team. They will provide connection settings before this plugin can be used for answers.";

export const PLUGIN_CONFIG_REQUIRED_MSG =
  "Configuration is required before this plugin can connect. Send the connection details to the owning team to continue.";

export const DB_SERVICES_NOT_CONNECTED_MSG =
  "DB services are not connected. Connect the Deutsche Bank service suite before enabling dbUnity or dbSupportPlus.";
