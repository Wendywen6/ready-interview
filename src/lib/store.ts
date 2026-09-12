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
  DiagnosticPlan,
} from './types';

/** 根据子能力状态推导父级状态 */
export function deriveParentStatus(subs: { status: CompetencyStatus }[]): CompetencyStatus {
  if (subs.length === 0) return 'unknown';
  if (subs.every(s => s.status === 'ready')) return 'ready';
  if (subs.some(s => s.status === 'weak')) return 'weak';
  if (subs.some(s => s.status === 'pending')) return 'pending';
  if (subs.some(s => s.status === 'ready') && subs.some(s => s.status === 'unknown')) return 'pending';
  return 'unknown';
}

/** 统计所有原子能力点数量 */
export function countAllSubs(competencies: Competency[]) {
  const all = competencies.flatMap(c => c.subCompetencies);
  return {
    total: all.length,
    unknown: all.filter(s => s.status === 'unknown').length,
    weak: all.filter(s => s.status === 'weak').length,
    pending: all.filter(s => s.status === 'pending').length,
    ready: all.filter(s => s.status === 'ready').length,
    verified: all.filter(s => s.status !== 'unknown').length,
  };
}

interface SessionState {
  config: InterviewConfig | null;
  resume: ResumeData | null;
  resumeText: string;
  competencies: Competency[];
  diagnosticPlan: DiagnosticPlan | null;
  currentPhase: Phase;
  currentCompetencyId: string | null;
  gaps: GapInfo[];
  diagnosticMessages: ChatMessage[];
  repairMessages: ChatMessage[];
  repairTargetGapId: string | null;
  diagnosticComplete: boolean;

  setConfig: (config: InterviewConfig) => void;
  setResume: (resume: ResumeData, text: string) => void;
  setCompetencies: (competencies: Competency[]) => void;
  setDiagnosticPlan: (plan: DiagnosticPlan) => void;
  updateSubCompetencyStatus: (competencyId: string, subId: string, status: CompetencyStatus, evidence?: Evidence[]) => void;
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
  applyEvaluation: (updates: { competencyId: string; subCompetencyId: string; status: CompetencyStatus; evidence: Evidence[] }[]) => void;
  reset: () => void;
}

const initialState = {
  config: null as InterviewConfig | null,
  resume: null as ResumeData | null,
  resumeText: '',
  competencies: [] as Competency[],
  diagnosticPlan: null as DiagnosticPlan | null,
  currentPhase: 'setup' as Phase,
  currentCompetencyId: null as string | null,
  gaps: [] as GapInfo[],
  diagnosticMessages: [] as ChatMessage[],
  repairMessages: [] as ChatMessage[],
  repairTargetGapId: null as string | null,
  diagnosticComplete: false,
};

export const useStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setConfig: (config) => set({ config }),
      setResume: (resume, text) => set({ resume, resumeText: text }),
      setCompetencies: (competencies) => set({ competencies }),
      setDiagnosticPlan: (plan) => set({ diagnosticPlan: plan }),

      updateSubCompetencyStatus: (competencyId, subId, status, evidence) =>
        set((state) => ({
          competencies: state.competencies.map((c) => {
            if (c.id !== competencyId) return c;
            const newSubs = c.subCompetencies.map((s) =>
              s.id === subId
                ? { ...s, status, ...(evidence ? { evidence } : {}), lastTestAt: Date.now() }
                : s
            );
            return { ...c, subCompetencies: newSubs, needsRetest: status === 'pending' };
          }),
        })),

      setPhase: (phase) => set({ currentPhase: phase }),
      setCurrentCompetency: (id) => set({ currentCompetencyId: id }),
      setGaps: (gaps) => set({ gaps }),
      setRepairTargetGap: (id) => set({ repairTargetGapId: id }),

      addDiagnosticMessage: (msg) =>
        set((state) => ({ diagnosticMessages: [...state.diagnosticMessages, msg] })),

      updateLastDiagnosticMessage: (content) =>
        set((state) => {
          const msgs = [...state.diagnosticMessages];
          if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          return { diagnosticMessages: msgs };
        }),

      addRepairMessage: (msg) =>
        set((state) => ({ repairMessages: [...state.repairMessages, msg] })),

      updateLastRepairMessage: (content) =>
        set((state) => {
          const msgs = [...state.repairMessages];
          if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          return { repairMessages: msgs };
        }),

      clearRepairMessages: () => set({ repairMessages: [] }),
      setDiagnosticComplete: (v) => set({ diagnosticComplete: v }),

      applyEvaluation: (updates) =>
        set((state) => {
          const newCompetencies = state.competencies.map((c) => {
            const relevantUpdates = updates.filter((u) => u.competencyId === c.id);
            if (relevantUpdates.length === 0) return c;
            const newSubs = c.subCompetencies.map((s) => {
              const update = relevantUpdates.find((u) => u.subCompetencyId === s.id);
              if (update) {
                return { ...s, status: update.status, evidence: update.evidence, lastTestAt: Date.now() };
              }
              return s;
            });
            return { ...c, subCompetencies: newSubs };
          });
          return { competencies: newCompetencies };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'ready-interview-session',
      version: 3,
      migrate: () => ({ ...initialState }),
    }
  )
);
