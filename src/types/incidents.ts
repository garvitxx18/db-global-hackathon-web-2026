export type IncidentSeverity = "info" | "warning" | "critical";
export type EvidenceKind = "log" | "api-response" | "runbook";
export type PublishingStatus = "Published" | "Failed" | "In Progress";

export type PcfCalculationStatus =
  | "Queued"
  | "Loading constituents"
  | "Calculating basket"
  | "Validating controls"
  | "Published"
  | "Failed";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  title: string;
  source: string;
  timestamp?: string;
  content: string;
  language?: "text" | "json";
}

export interface JiraDraft {
  type: "Bug";
  title: string;
  team: string;
  storyPoints: number;
  priority: "Medium" | "High" | "Critical";
}

export interface IncidentAnalysis {
  incidentId: string;
  fundId: string;
  summary: string;
  rootCause: string;
  businessImpact: string;
  failedAt: string;
  process: string;
  confidence: number;
  affectedTeams: string[];
  recommendations: string[];
  evidence: EvidenceItem[];
  jiraDraft: JiraDraft;
}

export interface PublishingRun {
  id: string;
  fundId: string;
  fundName: string;
  process: string;
  methodology: "Synthetic" | "Equity" | "Multi Asset";
  region: string;
  scheduled: string;
  completed: string | null;
  status: PublishingStatus;
  calculationStatus: PcfCalculationStatus;
  creationUnit: number;
  isDemoIncident?: boolean;
}

export interface AffectedFund {
  fundId: string;
  status: "Blocked";
  dependency: string;
}

export interface DashboardSummary {
  totalFunds: number;
  published: number;
  failed: number;
  inProgress: number;
  completionPercent: number;
}
