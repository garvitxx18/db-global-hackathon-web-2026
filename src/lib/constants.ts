export const PRODUCT_NAME = "Agent10";
export const PRODUCT_SHORT_NAME = "Agent10";
export const PRODUCT_DESCRIPTION =
  "Business-aware incident intelligence for support, engineering, and operations.";

export const APP_NAME = "PCF Generation Operations";
export const DASHBOARD_TITLE = "PCF Generation Monitor";
export const DASHBOARD_SUBTITLE =
  "Track Synthetic, Equity, and Multi Asset PCF calculation status across the current processing window.";

export const PROCESSING_DATE = "23 Jul 2026";
export const PROCESSING_DATE_ISO = "2026-07-23";
export const DEMO_FUND_ID = "LU0411078552";
export const ENVIRONMENT = "Production";

export const ANALYSIS_DURATION_MS = 3800;
export const ANALYSIS_PLUGIN_STEP_MS = 520;
export const ANALYSIS_STEP_MIN_MS = 520;

export const ANALYSIS_STEPS = [
  "Checking publishing run",
  "Correlating service logs",
  "Reviewing business rules",
  "Mapping affected funds",
] as const;

export const INITIAL_ASSISTANT_MESSAGE =
  "I can investigate fund publishing, PCF generation, NAV differences, data loads, and application incidents. What would you like to understand?";

export const SUGGESTED_PROMPTS = [
  "Why did today's PCF not publish?",
  "Why did LU0411078552 fail?",
  "Which funds are affected?",
  "What should Operations do next?",
] as const;

export const COMPOSER_PLACEHOLDERS = [
  "Why did today's PCF not publish?",
  "Why did LU0411078552 fail today?",
  "Which funds are affected?",
  "What should Operations do next?",
] as const;

export const FALLBACK_RESPONSE =
  'I can demonstrate incident analysis for the current PCF publishing failure. Try asking "Why did LU0411078552 fail today?" or "Which funds are affected?"';

export const SUPPORT_TEAM_NAME = "ETF Operations Support";
export const TEAMS_CHANNEL = "ETF Ops · Incident Bridge";

/** Colleagues available for one-click Teams calls from Agent10. */
export const TEAMS_CALL_CONTACTS = [
  {
    id: "sravan",
    name: "Sravan Kumar Majjiga",
    email:
      "sravankumarmajjiga.gmail.com@dbaihackathon2026outlook.onmicrosoft.com",
    role: "Hackathon teammate",
  },
] as const;

export function buildTeamsCallUrl(email: string, withVideo = true): string {
  const params = new URLSearchParams({
    users: email,
    ...(withVideo ? { withVideo: "true" } : {}),
  });
  return `https://teams.microsoft.com/l/call/0/0?${params.toString()}`;
}

export const SUPPORT_AUTO_REPLY =
  "Thanks — your question was routed to ETF Operations Support (demo). A specialist typically responds within 15 minutes during market hours.";

export const OPINION_ACK =
  "Thanks for the opinion. It has been attached to this incident thread for the support and engineering review (demo only).";

export const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview", active: false },
  { id: "fund-publishing", label: "Fund Publishing", active: false },
  { id: "pcf-generation", label: "PCF Generation", active: true },
  { id: "nav-validation", label: "NAV Validation", active: false },
  { id: "data-loads", label: "Data Loads", active: false },
  { id: "incidents", label: "Incidents", active: false },
  { id: "runbooks", label: "Runbooks", active: false },
] as const;
