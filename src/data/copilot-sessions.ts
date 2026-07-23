import type { ChatSession, ServiceStatusSummary } from "@/types/copilot";
import { INITIAL_ASSISTANT_MESSAGE } from "@/lib/constants";
import { pcfIncidentAnalysis } from "@/data/mock-incidents";

export const serviceStatusSummary: ServiceStatusSummary = {
  totalServices: 6,
  healthyServices: 4,
  degradedServices: 2,
  totalPodsRunning: 23,
  totalPodsDesired: 26,
  services: [
    {
      id: "svc-pcf",
      name: "pcf-calculation-engine",
      team: "PCF Calculation Team",
      podsRunning: 3,
      podsDesired: 4,
      health: "degraded",
      lastHeartbeat: "09:32 UTC",
    },
    {
      id: "svc-index",
      name: "index-data-service",
      team: "Index Data Services",
      podsRunning: 2,
      podsDesired: 4,
      health: "degraded",
      lastHeartbeat: "09:31 UTC",
    },
    {
      id: "svc-publish",
      name: "fund-publishing-api",
      team: "ETF Operations",
      podsRunning: 4,
      podsDesired: 4,
      health: "healthy",
      lastHeartbeat: "09:34 UTC",
    },
    {
      id: "svc-nav",
      name: "nav-validation-service",
      team: "NAV Validation",
      podsRunning: 3,
      podsDesired: 3,
      health: "healthy",
      lastHeartbeat: "09:33 UTC",
    },
    {
      id: "svc-load",
      name: "constituent-load-worker",
      team: "Index Data Services",
      podsRunning: 5,
      podsDesired: 5,
      health: "healthy",
      lastHeartbeat: "09:30 UTC",
    },
    {
      id: "svc-notify",
      name: "ops-notification-gateway",
      team: "Platform Ops",
      podsRunning: 6,
      podsDesired: 6,
      health: "healthy",
      lastHeartbeat: "09:34 UTC",
    },
  ],
};

export const initialChatSessions: ChatSession[] = [
  {
    id: "chat-active",
    incidentId: "INC-PCF-240723-001",
    title: "Synthetic PCF blocked",
    fundId: "LU0411078552",
    updatedAt: "2026-07-23T09:34:00.000Z",
    status: "investigating",
    messages: [
      {
        id: "msg-initial",
        role: "assistant",
        content: INITIAL_ASSISTANT_MESSAGE,
        createdAt: "2026-07-23T19:05:00.000Z",
      },
    ],
  },
  {
    id: "chat-nav-diff",
    incidentId: "INC-NAV-240722-014",
    title: "NAV variance on IE00BKM4GZ66",
    fundId: "IE00BKM4GZ66",
    updatedAt: "2026-07-22T16:12:00.000Z",
    status: "resolved",
    messages: [
      {
        id: "msg-nav-1",
        role: "user",
        content: "Why is NAV validation delayed for IE00BKM4GZ66?",
        createdAt: "2026-07-22T15:40:00.000Z",
      },
      {
        id: "msg-nav-2",
        role: "assistant",
        content:
          "NAV validation was waiting on a late pricing feed. The feed recovered at 15:58 UTC and the fund completed shortly after.",
        createdAt: "2026-07-22T15:41:30.000Z",
      },
    ],
  },
  {
    id: "chat-load",
    incidentId: "INC-DATA-240721-008",
    title: "Constituent load retry",
    fundId: "LU1681045370",
    updatedAt: "2026-07-21T11:05:00.000Z",
    status: "resolved",
    messages: [
      {
        id: "msg-load-1",
        role: "user",
        content: "Did the constituent load complete overnight?",
        createdAt: "2026-07-21T10:50:00.000Z",
      },
      {
        id: "msg-load-2",
        role: "assistant",
        content:
          "Yes. The overnight constituent load completed at 02:14 UTC after one retry. Downstream PCF jobs were requeued successfully.",
        createdAt: "2026-07-21T10:51:10.000Z",
      },
    ],
  },
  {
    id: "chat-prev-pcf",
    incidentId: "INC-PCF-240720-003",
    title: "Empty basket on prior window",
    fundId: "LU0411078552",
    updatedAt: "2026-07-20T09:48:00.000Z",
    status: "open",
    messages: [
      {
        id: "msg-prev-1",
        role: "user",
        content: "Why did LU0411078552 fail today?",
        createdAt: "2026-07-20T09:40:00.000Z",
      },
      {
        id: "msg-prev-2",
        role: "assistant",
        content: pcfIncidentAnalysis.summary,
        analysis: pcfIncidentAnalysis,
        createdAt: "2026-07-20T09:41:30.000Z",
      },
    ],
  },
];
