"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CaseFile,
  CaseSummary,
  Citation,
  Finding,
  Note,
  ReportComplianceScan,
  ReportDraft,
  ReportSectionStatus,
  ReportSnapshot,
  ReportTemplateId,
  TimelineEvent,
} from "@repo/types";
import { commandClient } from "@/lib/command-client";
import { DEFAULT_REPORT_TEMPLATE_ID, getReportTemplate } from "@/lib/report-templates";
import { useAiAvailability } from "@/hooks/use-ai-availability";

const TEMPLATE_STORAGE_KEY = "casespace.reportTemplate";

function loadTemplateForCase(caseId: string): ReportTemplateId {
  if (typeof window === "undefined") return DEFAULT_REPORT_TEMPLATE_ID;
  try {
    const raw = localStorage.getItem(`${TEMPLATE_STORAGE_KEY}.${caseId}`);
    return (raw as ReportTemplateId) || DEFAULT_REPORT_TEMPLATE_ID;
  } catch {
    return DEFAULT_REPORT_TEMPLATE_ID;
  }
}

function saveTemplateForCase(caseId: string, templateId: ReportTemplateId) {
  try {
    localStorage.setItem(`${TEMPLATE_STORAGE_KEY}.${caseId}`, templateId);
  } catch {
    /* ignore */
  }
}

export interface ReportOutlineItem {
  id: string;
  label: string;
  status: ReportSectionStatus;
}

interface ReportWorkspaceContextValue {
  caseId: string;
  caseSummary: CaseSummary;
  files: CaseFile[];
  notes: Note[];
  findings: Finding[];
  timeline: TimelineEvent[];
  templateId: ReportTemplateId;
  setTemplateId: (id: ReportTemplateId) => void;
  draft: ReportDraft | null;
  loading: boolean;
  generating: boolean;
  aiAvailable: boolean;
  aiAvailabilityLoading: boolean;
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  outline: ReportOutlineItem[];
  billingAmount: number | null;
  approvedAiFindings: number;
  complianceScan: ReportComplianceScan | null;
  snapshots: ReportSnapshot[];
  selectedCitation: Citation | null;
  setSelectedCitation: (c: Citation | null) => void;
  refreshDraft: () => Promise<void>;
  generateFirstDraft: () => Promise<void>;
  regenerate: (scope: "all" | "unreviewed" | "section", sectionId?: string) => Promise<void>;
  updateSection: (
    sectionId: string,
    text: string,
    status: ReportSectionStatus,
    immediate?: boolean,
  ) => void;
  markSectionReviewed: (sectionId: string) => Promise<void>;
  toggleSectionLock: (sectionId: string) => Promise<void>;
  runComplianceScan: () => Promise<ReportComplianceScan | null>;
  exportMarkdown: () => Promise<string | null>;
  exportDocx: (savePath: string) => Promise<boolean>;
  createSnapshot: (label: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;
  loadSnapshots: () => Promise<void>;
  scrollToSection: (sectionId: string) => void;
  registerSectionRef: (sectionId: string, el: HTMLElement | null) => void;
}

const ReportWorkspaceContext = createContext<ReportWorkspaceContextValue | null>(
  null,
);

export function useReportWorkspace() {
  const ctx = useContext(ReportWorkspaceContext);
  if (!ctx) {
    throw new Error("useReportWorkspace must be used within ReportWorkspaceProvider");
  }
  return ctx;
}

interface ReportWorkspaceProviderProps {
  caseId: string;
  caseSummary: CaseSummary;
  files: CaseFile[];
  notes: Note[];
  findings: Finding[];
  timeline: TimelineEvent[];
  children: ReactNode;
}

export function ReportWorkspaceProvider({
  caseId,
  caseSummary,
  files,
  notes,
  findings,
  timeline,
  children,
}: ReportWorkspaceProviderProps) {
  const { aiAvailable, loading: aiAvailabilityLoading } = useAiAvailability();
  const [templateId, setTemplateIdState] = useState<ReportTemplateId>(() =>
    loadTemplateForCase(caseId),
  );
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [billingAmount, setBillingAmount] = useState<number | null>(null);
  const [approvedAiFindings, setApprovedAiFindings] = useState(0);
  const [complianceScan, setComplianceScan] = useState<ReportComplianceScan | null>(
    null,
  );
  const [snapshots, setSnapshots] = useState<ReportSnapshot[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const setTemplateId = useCallback(
    (id: ReportTemplateId) => {
      setTemplateIdState(id);
      saveTemplateForCase(caseId, id);
    },
    [caseId],
  );

  useEffect(() => {
    setTemplateIdState(loadTemplateForCase(caseId));
  }, [caseId]);

  const template = getReportTemplate(templateId);

  const outline = useMemo((): ReportOutlineItem[] => {
    const specs = template?.sections ?? [];
    return specs.map((spec) => ({
      id: spec.id,
      label: spec.label,
      status: draft?.sectionStatus[spec.id] ?? "empty",
    }));
  }, [template, draft?.sectionStatus]);

  const refreshDraft = useCallback(async () => {
    setLoading(true);
    const res = await commandClient.getReportDraft(caseId, templateId);
    if (res.ok) setDraft(res.data ?? null);
    setLoading(false);
  }, [caseId, templateId]);

  const loadSnapshots = useCallback(async () => {
    const res = await commandClient.listReportSnapshots(caseId, templateId);
    if (res.ok && res.data) setSnapshots(res.data);
  }, [caseId, templateId]);

  useEffect(() => {
    void refreshDraft();
    void loadSnapshots();
    void commandClient.calculateBillingAmount(caseId).then((res) => {
      if (res.ok && res.data) setBillingAmount(res.data.amount);
    });
    void commandClient.countApprovedAiFindings(caseId).then((res) => {
      if (res.ok && res.data != null) setApprovedAiFindings(res.data);
    });
  }, [caseId, templateId, refreshDraft, loadSnapshots]);

  const generateFirstDraft = useCallback(async () => {
    setGenerating(true);
    const res = await commandClient.generateAndSaveReportDraft(caseId, templateId);
    setGenerating(false);
    if (res.ok && res.data) {
      setDraft(res.data);
      void loadSnapshots();
    } else {
      throw new Error(res.error?.message ?? "Failed to generate report draft");
    }
  }, [caseId, templateId, loadSnapshots]);

  const regenerate = useCallback(
    async (scope: "all" | "unreviewed" | "section", sectionId?: string) => {
      setGenerating(true);
      const res = await commandClient.regenerateReport(caseId, templateId, {
        scope,
        sectionId,
      });
      setGenerating(false);
      if (res.ok && res.data) setDraft(res.data);
      else throw new Error(res.error?.message ?? "Regeneration failed");
    },
    [caseId, templateId],
  );

  const persistSection = useCallback(
    async (sectionId: string, text: string, status: ReportSectionStatus) => {
      const res = await commandClient.updateReportSection(
        caseId,
        templateId,
        sectionId,
        text,
        status,
      );
      if (res.ok && res.data) setDraft(res.data);
    },
    [caseId, templateId],
  );

  const updateSection = useCallback(
    (
      sectionId: string,
      text: string,
      status: ReportSectionStatus,
      immediate = false,
    ) => {
      if (immediate) {
        void persistSection(sectionId, text, status);
        return;
      }
      const existing = saveTimers.current.get(sectionId);
      if (existing) clearTimeout(existing);
      saveTimers.current.set(
        sectionId,
        setTimeout(() => {
          void persistSection(sectionId, text, status);
        }, 500),
      );
    },
    [persistSection],
  );

  const markSectionReviewed = useCallback(
    async (sectionId: string) => {
      const section = draft?.document.sections.find((s) => s.id === sectionId);
      if (!section) return;
      updateSection(sectionId, section.text, "reviewed", true);
    },
    [draft, updateSection],
  );

  const toggleSectionLock = useCallback(
    async (sectionId: string) => {
      const current = draft?.sectionStatus[sectionId] ?? "empty";
      const section = draft?.document.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const next: ReportSectionStatus =
        current === "locked" ? "reviewed" : "locked";
      updateSection(sectionId, section.text, next, true);
    },
    [draft, updateSection],
  );

  const runComplianceScan = useCallback(async () => {
    const res = await commandClient.runReportComplianceScan(caseId, templateId);
    if (res.ok && res.data) {
      setComplianceScan(res.data);
      return res.data;
    }
    return null;
  }, [caseId, templateId]);

  const exportMarkdown = useCallback(async () => {
    const res = await commandClient.exportReportMarkdown(caseId, templateId);
    if (res.ok && res.data) return res.data;
    return null;
  }, [caseId, templateId]);

  const exportDocx = useCallback(
    async (savePath: string) => {
      const res = await commandClient.exportReportDocx(caseId, templateId, savePath);
      return res.ok;
    },
    [caseId, templateId],
  );

  const createSnapshot = useCallback(
    async (label: string) => {
      await commandClient.createReportSnapshot(caseId, templateId, label);
      await loadSnapshots();
    },
    [caseId, templateId, loadSnapshots],
  );

  const restoreSnapshot = useCallback(
    async (snapshotId: string) => {
      const res = await commandClient.restoreReportSnapshot(snapshotId);
      if (res.ok && res.data) setDraft(res.data);
    },
    [],
  );

  const registerSectionRef = useCallback(
    (sectionId: string, el: HTMLElement | null) => {
      if (el) sectionRefs.current.set(sectionId, el);
      else sectionRefs.current.delete(sectionId);
    },
    [],
  );

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    sectionRefs.current.get(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const value: ReportWorkspaceContextValue = {
    caseId,
    caseSummary,
    files,
    notes,
    findings,
    timeline,
    templateId,
    setTemplateId,
    draft,
    loading,
    generating,
    aiAvailable,
    aiAvailabilityLoading,
    activeSectionId,
    setActiveSectionId,
    outline,
    billingAmount,
    approvedAiFindings,
    complianceScan,
    snapshots,
    selectedCitation,
    setSelectedCitation,
    refreshDraft,
    generateFirstDraft,
    regenerate,
    updateSection,
    markSectionReviewed,
    toggleSectionLock,
    runComplianceScan,
    exportMarkdown,
    exportDocx,
    createSnapshot,
    restoreSnapshot,
    loadSnapshots,
    scrollToSection,
    registerSectionRef,
  };

  return (
    <ReportWorkspaceContext.Provider value={value}>
      {children}
    </ReportWorkspaceContext.Provider>
  );
}
