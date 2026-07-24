"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  initialChatSessions,
  serviceStatusSummary,
} from "@/data/copilot-sessions";
import {
  initialPlugins,
  isDbPlugin,
  PLUGIN_CONFIG_REQUIRED_MSG,
  PLUGIN_ENABLE_REQUEST_ACK,
  DB_SERVICES_NOT_CONNECTED_MSG,
} from "@/data/plugins";
import {
  askCopilot,
  buildAnalysisSteps,
} from "@/lib/mock-copilot-service";
import {
  INITIAL_ASSISTANT_MESSAGE,
  OPINION_ACK,
  PROCESSING_DATE,
  SUPPORT_AVAILABLE_OFFER,
  SUPPORT_CONTACT,
  SUPPORT_OFFER_DELAY_MS,
  SUPPORT_SUBMITTED_ACK,
  buildTeamsCallUrl,
} from "@/lib/constants";
import type {
  ChatMessage,
  ChatSession,
  CollaborationMode,
  CopilotContext,
  CopilotPlugin,
  CopilotSideTab,
  FeedbackValue,
  JiraDraftState,
  PluginId,
  ServiceStatusSummary,
} from "@/types/copilot";

interface CopilotContextValue {
  isOpen: boolean;
  context: CopilotContext | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  activeSessionId: string;
  activeIncidentId: string;
  sideTab: CopilotSideTab;
  serviceStatus: ServiceStatusSummary;
  plugins: CopilotPlugin[];
  analysisSteps: string[];
  isAnalyzing: boolean;
  helperLabelDismissed: boolean;
  jiraDraftState: JiraDraftState;
  feedback: FeedbackValue;
  collaborationMode: CollaborationMode;
  draft: string;
  setDraft: (value: string) => void;
  launcherRef: RefObject<HTMLButtonElement | null>;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  hasFailedIncident: boolean;
  openCopilot: (context?: CopilotContext, prefillQuestion?: string) => void;
  closeCopilot: () => void;
  ask: (question: string) => Promise<void>;
  clearConversation: () => void;
  removeContext: () => void;
  dismissHelperLabel: () => void;
  reviewJiraDraft: () => void;
  confirmDemoJira: () => void;
  cancelJiraReview: () => void;
  submitFeedback: (value: FeedbackValue) => void;
  setSideTab: (tab: CopilotSideTab) => void;
  selectSession: (sessionId: string) => void;
  startNewChat: () => void;
  setCollaborationMode: (mode: CollaborationMode) => void;
  submitOpinion: (opinion: string) => void;
  askSupport: (question: string) => void;
  connectTeams: (contact: { name: string; email: string }) => void;
  togglePluginSelected: (pluginId: PluginId) => void;
  requestPluginEnable: (pluginId: PluginId) => void;
}

const CopilotReactContext = createContext<CopilotContextValue | null>(null);

function createWelcomeMessage(): ChatMessage {
  return {
    id: "msg-initial",
    role: "assistant",
    content: INITIAL_ASSISTANT_MESSAGE,
    createdAt: "2026-07-24T09:35:00.000Z",
  };
}

function nextIncidentId(existing: ChatSession[]): string {
  const seq = String(existing.length + 1).padStart(3, "0");
  return `INC-PCF-240724-${seq}`;
}

export function CopilotProvider({
  children,
  hasFailedIncident = true,
}: {
  children: ReactNode;
  hasFailedIncident?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<CopilotContext | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(initialChatSessions);
  const [activeSessionId, setActiveSessionId] = useState(
    initialChatSessions[0]?.id ?? "chat-active"
  );
  const [sideTab, setSideTab] = useState<CopilotSideTab>("chats");
  const [plugins, setPlugins] = useState<CopilotPlugin[]>(initialPlugins);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [helperLabelDismissed, setHelperLabelDismissed] = useState(false);
  const [jiraDraftState, setJiraDraftState] = useState<JiraDraftState>("idle");
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [collaborationMode, setCollaborationMode] =
    useState<CollaborationMode>("idle");
  const [draft, setDraft] = useState("");

  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId]
  );
  const messages = useMemo(
    () => activeSession?.messages ?? [],
    [activeSession]
  );
  const activeIncidentId = activeSession?.incidentId ?? "INC-DEMO-000";

  const selectedPlugins = useMemo(
    () =>
      plugins.filter(
        (plugin) => plugin.status === "connected" && plugin.selected
      ),
    [plugins]
  );

  const updateActiveMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: updater(session.messages),
                updatedAt: new Date().toISOString(),
              }
            : session
        )
      );
    },
    [activeSessionId]
  );

  const dismissHelperLabel = useCallback(() => {
    setHelperLabelDismissed(true);
  }, []);

  const openCopilot = useCallback(
    (nextContext?: CopilotContext, prefillQuestion?: string) => {
      setIsOpen(true);
      setHelperLabelDismissed(true);
      setSideTab("chats");
      if (nextContext) {
        setContext({
          fundId: nextContext.fundId,
          processingDate: nextContext.processingDate ?? PROCESSING_DATE,
        });
      }
      if (prefillQuestion) {
        setDraft(prefillQuestion);
      }
      requestAnimationFrame(() => {
        composerRef.current?.focus();
      });
    },
    []
  );

  const closeCopilot = useCallback(() => {
    setIsOpen(false);
    setCollaborationMode("idle");
    setJiraDraftState((prev) => (prev === "reviewing" ? "idle" : prev));
    requestAnimationFrame(() => {
      launcherRef.current?.focus();
    });
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isAnalyzing) return;

      const userMessage: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const steps = buildAnalysisSteps(
        selectedPlugins.map((plugin) => plugin.thinkingStep)
      );
      setAnalysisSteps(steps);

      updateActiveMessages((prev) => [...prev, userMessage]);
      setIsAnalyzing(true);
      setFeedback(null);
      setJiraDraftState("idle");
      setCollaborationMode("idle");
      setDraft("");

      try {
        const response = await askCopilot(trimmed, {
          fundId: context?.fundId ?? activeSession?.fundId,
          processingDate: context?.processingDate,
          selectedPlugins: selectedPlugins.map((plugin) => ({
            id: plugin.id,
            name: plugin.name,
          })),
        });
        updateActiveMessages((prev) => [...prev, response]);
      } finally {
        setIsAnalyzing(false);
        setAnalysisSteps([]);
      }
    },
    [
      activeSession?.fundId,
      context,
      isAnalyzing,
      selectedPlugins,
      updateActiveMessages,
    ]
  );

  const clearConversation = useCallback(() => {
    updateActiveMessages(() => [createWelcomeMessage()]);
    setFeedback(null);
    setJiraDraftState("idle");
    setDraft("");
    setCollaborationMode("idle");
  }, [updateActiveMessages]);

  const removeContext = useCallback(() => {
    setContext(null);
  }, []);

  const selectSession = useCallback(
    (sessionId: string) => {
      const selected = sessions.find((session) => session.id === sessionId);
      setActiveSessionId(sessionId);
      setFeedback(null);
      setJiraDraftState("idle");
      setCollaborationMode("idle");
      setDraft("");
      if (selected?.fundId) {
        setContext({
          fundId: selected.fundId,
          processingDate: PROCESSING_DATE,
        });
      }
      requestAnimationFrame(() => {
        composerRef.current?.focus();
      });
    },
    [sessions]
  );

  const startNewChat = useCallback(() => {
    const createdAt = new Date().toISOString();
    const sessionId = `chat-${Date.now()}`;
    setSessions((prev) => {
      const session: ChatSession = {
        id: sessionId,
        incidentId: nextIncidentId(prev),
        title: "New investigation",
        fundId: context?.fundId,
        updatedAt: createdAt,
        status: "open",
        messages: [
          {
            id: `msg-initial-${sessionId}`,
            role: "assistant",
            content: INITIAL_ASSISTANT_MESSAGE,
            createdAt,
          },
        ],
      };
      return [session, ...prev];
    });
    setActiveSessionId(sessionId);
    setFeedback(null);
    setJiraDraftState("idle");
    setCollaborationMode("idle");
    setDraft("");
    setSideTab("chats");
  }, [context?.fundId]);

  const appendSystemStyleAssistant = useCallback(
    (content: string) => {
      const message: ChatMessage = {
        id: `msg-collab-${Date.now()}`,
        role: "assistant",
        kind: "ack",
        content,
        createdAt: new Date().toISOString(),
      };
      updateActiveMessages((prev) => [...prev, message]);
    },
    [updateActiveMessages]
  );

  const togglePluginSelected = useCallback((pluginId: PluginId) => {
    setPlugins((prev) =>
      prev.map((plugin) => {
        if (plugin.id !== pluginId || plugin.status !== "connected") {
          return plugin;
        }
        return { ...plugin, selected: !plugin.selected };
      })
    );
  }, []);

  const requestPluginEnable = useCallback(
    (pluginId: PluginId) => {
      const plugin = plugins.find((item) => item.id === pluginId);
      if (!plugin) return;

      if (isDbPlugin(pluginId)) {
        appendSystemStyleAssistant(
          `${plugin.name}: ${DB_SERVICES_NOT_CONNECTED_MSG}`
        );
        setSideTab("chats");
        return;
      }

      if (plugin.status === "config_required") {
        appendSystemStyleAssistant(
          `${plugin.name}: ${PLUGIN_CONFIG_REQUIRED_MSG}`
        );
        setSideTab("chats");
        return;
      }

      if (plugin.status !== "available") return;

      setPlugins((prev) =>
        prev.map((item) =>
          item.id === pluginId
            ? { ...item, status: "pending", selected: false }
            : item
        )
      );
      appendSystemStyleAssistant(
        `${plugin.name}: ${PLUGIN_ENABLE_REQUEST_ACK} Owner: ${plugin.ownerTeam}.`
      );
      setSideTab("chats");
    },
    [appendSystemStyleAssistant, plugins]
  );

  const submitOpinion = useCallback(
    (opinion: string) => {
      const trimmed = opinion.trim();
      if (!trimmed) return;
      const userMessage: ChatMessage = {
        id: `msg-opinion-${Date.now()}`,
        role: "user",
        kind: "opinion",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      updateActiveMessages((prev) => [...prev, userMessage]);
      appendSystemStyleAssistant(OPINION_ACK);
      setCollaborationMode("idle");
    },
    [appendSystemStyleAssistant, updateActiveMessages]
  );

  const askSupport = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: `msg-support-${Date.now()}`,
        role: "user",
        kind: "support",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      updateActiveMessages((prev) => [...prev, userMessage]);
      appendSystemStyleAssistant(SUPPORT_SUBMITTED_ACK);
      setCollaborationMode("idle");

      window.setTimeout(() => {
        const offerMessage: ChatMessage = {
          id: `msg-support-offer-${Date.now()}`,
          role: "assistant",
          kind: "support-offer",
          content: SUPPORT_AVAILABLE_OFFER,
          callContact: {
            name: SUPPORT_CONTACT.name,
            email: SUPPORT_CONTACT.email,
            role: SUPPORT_CONTACT.role,
          },
          createdAt: new Date().toISOString(),
        };
        updateActiveMessages((prev) => [...prev, offerMessage]);
      }, SUPPORT_OFFER_DELAY_MS);
    },
    [appendSystemStyleAssistant, updateActiveMessages]
  );

  const connectTeams = useCallback(
    (contact: { name: string; email: string }) => {
      const callUrl = buildTeamsCallUrl(contact.email, true);
      window.open(callUrl, "_blank", "noopener,noreferrer");
      appendSystemStyleAssistant(
        `Opening a Microsoft Teams call with ${contact.name} (${contact.email}). If Teams does not open automatically, allow pop-ups or open the link from your browser.`
      );
      setCollaborationMode("idle");
    },
    [appendSystemStyleAssistant]
  );

  const reviewJiraDraft = useCallback(() => {
    setJiraDraftState("reviewing");
  }, []);

  const confirmDemoJira = useCallback(() => {
    setJiraDraftState("created");
    appendSystemStyleAssistant(
      "Jira defect BUG-1042 created for PCF Calculation Team — Handle missing security details in PCF calculation (High, 3 pts)."
    );
  }, [appendSystemStyleAssistant]);

  const cancelJiraReview = useCallback(() => {
    setJiraDraftState("idle");
  }, []);

  const submitFeedback = useCallback((value: FeedbackValue) => {
    setFeedback(value);
  }, []);

  const value = useMemo<CopilotContextValue>(
    () => ({
      isOpen,
      context,
      messages,
      sessions,
      activeSessionId,
      activeIncidentId,
      sideTab,
      serviceStatus: serviceStatusSummary,
      plugins,
      analysisSteps,
      isAnalyzing,
      helperLabelDismissed,
      jiraDraftState,
      feedback,
      collaborationMode,
      draft,
      setDraft,
      launcherRef,
      composerRef,
      hasFailedIncident,
      openCopilot,
      closeCopilot,
      ask,
      clearConversation,
      removeContext,
      dismissHelperLabel,
      reviewJiraDraft,
      confirmDemoJira,
      cancelJiraReview,
      submitFeedback,
      setSideTab,
      selectSession,
      startNewChat,
      setCollaborationMode,
      submitOpinion,
      askSupport,
      connectTeams,
      togglePluginSelected,
      requestPluginEnable,
    }),
    [
      isOpen,
      context,
      messages,
      sessions,
      activeSessionId,
      activeIncidentId,
      sideTab,
      plugins,
      analysisSteps,
      isAnalyzing,
      helperLabelDismissed,
      jiraDraftState,
      feedback,
      collaborationMode,
      draft,
      hasFailedIncident,
      openCopilot,
      closeCopilot,
      ask,
      clearConversation,
      removeContext,
      dismissHelperLabel,
      reviewJiraDraft,
      confirmDemoJira,
      cancelJiraReview,
      submitFeedback,
      selectSession,
      startNewChat,
      submitOpinion,
      askSupport,
      connectTeams,
      togglePluginSelected,
      requestPluginEnable,
    ]
  );

  return (
    <CopilotReactContext.Provider value={value}>
      {children}
    </CopilotReactContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotReactContext);
  if (!ctx) {
    throw new Error("useCopilot must be used within CopilotProvider");
  }
  return ctx;
}
