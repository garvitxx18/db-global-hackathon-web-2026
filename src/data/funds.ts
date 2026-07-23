import type { AffectedFund, DashboardSummary, PublishingRun } from "@/types/incidents";
import { DEMO_FUND_ID } from "@/lib/constants";

export const dashboardSummary: DashboardSummary = {
  totalFunds: 128,
  published: 119,
  failed: 8,
  inProgress: 1,
  completionPercent: 92.9,
};

export const publishingRuns: PublishingRun[] = [
  {
    id: "run-1",
    fundId: DEMO_FUND_ID,
    process: "Synthetic Fund PCF",
    region: "EMEA",
    scheduled: "09:30 UTC",
    completed: null,
    status: "Failed",
    isDemoIncident: true,
  },
  {
    id: "run-2",
    fundId: "IE00B4L5Y983",
    process: "Physical ETF PCF",
    region: "EMEA",
    scheduled: "09:30 UTC",
    completed: "09:31 UTC",
    status: "Published",
  },
  {
    id: "run-3",
    fundId: "US4642872000",
    process: "Basket Publishing",
    region: "AMER",
    scheduled: "13:00 UTC",
    completed: "13:01 UTC",
    status: "Published",
  },
  {
    id: "run-4",
    fundId: "LU1681045370",
    process: "Synthetic Fund PCF",
    region: "EMEA",
    scheduled: "09:30 UTC",
    completed: null,
    status: "Failed",
  },
  {
    id: "run-5",
    fundId: "IE00BKM4GZ66",
    process: "NAV Publication",
    region: "EMEA",
    scheduled: "10:00 UTC",
    completed: null,
    status: "In Progress",
  },
];

export const affectedFunds: AffectedFund[] = [
  { fundId: "LU0411078552", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "LU1681045370", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "LU0290355717", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "LU0480132876", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "IE00B3XXRP09", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "LU1812090543", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "IE00BK5BQT80", status: "Blocked", dependency: "Index Data Service" },
  { fundId: "LU0378438131", status: "Blocked", dependency: "Index Data Service" },
];
