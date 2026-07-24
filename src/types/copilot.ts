export type ChatRole = "user" | "assistant";

export type JiraDraftState = "idle" | "reviewing" | "created";

export type FeedbackValue = "up" | "down" | null;

export type CopilotSideTab = "chats" | "services" | "plugins";

export type CollaborationMode = "idle" | "opinion" | "support";

export type ServiceHealth = "healthy" | "degraded" | "down";

export type PluginId =
  | "openshift"
  | "gcp"
  | "scribe"
  | "confluence"
  | "jira"
  | "teams"
  | "github"
  | "new-relic"
  | "db-unity"
  | "db-support-plus";

export type PluginStatus =
  | "connected"
  | "config_required"
  | "available"
  | "pending";

export interface CopilotPlugin {
  id: PluginId;
  name: string;
  description: string;
  status: PluginStatus;
  /** When true, this connected plugin contributes evidence to answers. */
  selected: boolean;
  thinkingStep: string;
  ownerTeam: string;
}

export interface CopilotContext {
  fundId?: string;
  processingDate?: string;
}

export type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
      /** Distinguishes collaboration notes from normal chat prompts. */
      kind?: "message" | "opinion" | "support";
      createdAt: string;
    }
  | {
      id: string;
      role: "assistant";
      content?: string;
      kind?: "message" | "ack" | "support-offer";
      analysis?: import("./incidents").IncidentAnalysis;
      affectedFunds?: import("./incidents").AffectedFund[];
      sources?: Array<{
        id: PluginId;
        name: string;
      }>;
      callContact?: {
        name: string;
        email: string;
        role: string;
      };
      createdAt: string;
    };

export interface ChatSession {
  id: string;
  incidentId: string;
  title: string;
  fundId?: string;
  updatedAt: string;
  status: "open" | "resolved" | "investigating";
  messages: ChatMessage[];
}

export interface ConnectedService {
  id: string;
  name: string;
  team: string;
  podsRunning: number;
  podsDesired: number;
  health: ServiceHealth;
  lastHeartbeat: string;
}

export interface ServiceStatusSummary {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  totalPodsRunning: number;
  totalPodsDesired: number;
  services: ConnectedService[];
}

export interface AskCopilotOptions {
  fundId?: string;
  processingDate?: string;
  selectedPlugins?: Array<{
    id: PluginId;
    name: string;
  }>;
}
