'use client';

/**
 * Ready - 全局状态管理
 * 使用 Zustand + localStorage 持久化
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  InterviewConfig,
  ResumeData,
  Competency,
  CompetencyStatus,
  Phase,
  GapInfo,
  ChatMessage,
  Evidence,
} from './types';

interface SessionState {
  // ===== 数据 =====
  config: InterviewConfig | null;
  resume: ResumeData | null;
  resumeText: string;
  competencies: Competency[];
  currentPhase: Phase;
  currentCompetencyId: string | null;
  gaps: GapInfo[];
  diagnosticMessages: ChatMessage[];
  repairMessages: ChatMessage[];
  repairTargetGapId: string | null;
  diagnosticComplete: boolean;

  // ===== Actions =====
  setConfig: (config: InterviewConfig) => void;
  setResume: (resume: ResumeData, text: string) => void;
  setCompetencies: (competencies: Competency[]) => void;
  updateCompetencyStatus: (id: string, status: CompetencyStatus, evidence?: Evidence[]) => void;
  setPhase: (phase: Phase) => void;
  setCurrentCompetency: (id: string | null) => void;
  setGaps: (gaps: GapInfo[]) => void;
  setRepairTargetGap: (id: string | null) => void;
  addDiagnosticMessage: (msg: ChatMessage) => void;
  updateLastDiagnosticMessage: (content: string) => void;
  addRepairMessage: (msg: ChatMessage) => void;
  updateLastRepairMessage: (content: string) => void;
  clearRepairMessages: () => void;
  setDiagnosticComplete: (v: boolean) => void;
  applyEvaluation: (updates: { competencyId: string; status: CompetencyStatus; evidence: Evidence[] }[]) => void;
  reset: () => void;
}

const initialState = {
  config: null,
  resume: null,
  resumeText: '',
  competencies: [],
  currentPhase: 'setup' as Phase,
  currentCompetencyId: null,
  gaps: [],
  diagnosticMessages: [],
  repairMessages: [],
  repairTargetGapId: null,
  diagnosticComplete: false,
};

export const useStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      // Note: messages use crypto.randomUUID() for unique IDs

      setConfig: (config) => set({ config }),

      setResume: (resume, text) => set({ resume, resumeText: text }),

      setCompetencies: (competencies) => set({ competencies }),

      updateCompetencyStatus: (id, status, evidence) =>
        set((state) => ({
          competencies: state.competencies.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status,
                  ...(evidence ? { evidence } : {}),
                  lastTestAt: Date.now(),
                  needsRetest: status === 'pending',
                }
              : c
          ),
        })),

      setPhase: (phase) => set({ currentPhase: phase }),

      setCurrentCompetency: (id) => set({ currentCompetencyId: id }),

      setGaps: (gaps) => set({ gaps }),

      setRepairTargetGap: (id) => set({ repairTargetGapId: id }),

      addDiagnosticMessage: (msg) =>
        set((state) => ({
          diagnosticMessages: [...state.diagnosticMessages, msg],
        })),

      updateLastDiagnosticMessage: (content) =>
        set((state) => {
          const msgs = [...state.diagnosticMessages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { diagnosticMessages: msgs };
        }),

      addRepairMessage: (msg) =>
        set((state) => ({
          repairMessages: [...state.repairMessages, msg],
        })),

      updateLastRepairMessage: (content) =>
        set((state) => {
          const msgs = [...state.repairMessages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { repairMessages: msgs };
        }),

      clearRepairMessages: () => set({ repairMessages: [] }),

      setDiagnosticComplete: (v) => set({ diagnosticComplete: v }),

      applyEvaluation: (updates) =>
        set((state) => {
          const newCompetencies = state.competencies.map((c) => {
            const update = updates.find((u) => u.competencyId === c.id);
            if (update) {
              return {
                ...c,
                status: update.status,
                evidence: update.evidence,
                lastTestAt: Date.now(),
                needsRetest: update.status === 'pending',
              };
            }
            return c;
          });
          return { competencies: newCompetencies };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'ready-interview-session',
      version: 2, // 版本号，升级会清除旧数据
      migrate: () => {
        // 迁移时清除旧数据，避免旧格式 ID 冲突
        return { ...initialState };
      },
    }
  )
);
