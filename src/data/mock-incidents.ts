import type { IncidentAnalysis } from "@/types/incidents";
import { DEMO_FUND_ID, PROCESSING_DATE_ISO } from "@/lib/constants";

export const pcfIncidentAnalysis: IncidentAnalysis = {
  incidentId: "inc-pcf-2026-07-24-001",
  fundId: DEMO_FUND_ID,
  summary:
    "LU0411078552 failed because Index Data Service returned an empty constituent set. The PCF Calculation Engine stopped validation at 09:32 UTC, so the synthetic fund basket could not be generated or published.",
  rootCause:
    "The index-data-service response did not contain required constituent data. PcfCalculationService attempted to read securityDetails, resulting in a NullPointerException.",
  businessImpact:
    "8 synthetic funds missed the current publishing window. ETF Operations cannot distribute their PCF files until constituent data is loaded and the jobs are reprocessed.",
  failedAt: "09:32 UTC",
  process: "Synthetic Fund PCF Calculation",
  confidence: 94,
  affectedTeams: [
    "ETF Operations",
    "PCF Calculation Team",
    "Index Data Services",
  ],
  recommendations: [
    "Confirm the constituent load completed in Index Data Service.",
    "Re-run the failed PCF jobs.",
    "Add response validation and null handling before calculation.",
  ],
  evidence: [
    {
      id: "ev-log-1",
      kind: "log",
      title: "PCF Calculation Engine error",
      source: "pcf-calculation-engine",
      timestamp: "2026-07-24T09:32:14.118Z",
      language: "text",
      content: `2026-07-24T09:32:14.118Z ERROR pcf-calculation-engine
NullPointerException: securityDetails is null
at PcfCalculationService.calculate(PcfCalculationService.java:219)
correlationId=pcf-7d92a1 fundId=LU0411078552`,
    },
    {
      id: "ev-api-1",
      kind: "api-response",
      title: "Dependency response",
      source: "index-data-service",
      timestamp: "2026-07-24T09:32:13.901Z",
      language: "json",
      content: JSON.stringify(
        {
          fundId: DEMO_FUND_ID,
          effectiveDate: PROCESSING_DATE_ISO,
          constituents: [],
        },
        null,
        2
      ),
    },
    {
      id: "ev-runbook-1",
      kind: "runbook",
      title: "Synthetic PCF Failure Recovery",
      source: "Synthetic PCF Failure Recovery",
      timestamp: "2026-07-24T09:32:14.118Z",
      language: "text",
      content:
        "relevant rule: Do not run PCF calculation before constituent-load completion",
    },
  ],
  jiraDraft: {
    type: "Bug",
    title: "Handle missing security details in PCF calculation",
    team: "PCF Calculation Team",
    storyPoints: 3,
    priority: "High",
  },
};
