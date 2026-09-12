/**
 * Ready - 保研面试准备度分诊
 * 核心数据类型定义
 */

// ==================== 能力点状态 ====================

/** 能力点的四种状态 */
export type CompetencyStatus = 'unknown' | 'weak' | 'pending' | 'ready';

/** 能力点所属类别 */
export type CompetencyCategory = 'project' | 'foundation' | 'direction' | 'expression' | 'engineering';

/** 能力点的来源标签 */
export type CompetencySource = 'resume' | 'target' | 'general' | 'official';

/** 产品阶段 */
export type Phase = 'setup' | 'map' | 'diagnostic' | 'gaps' | 'repair' | 'retest' | 'summary';

// ==================== 简历相关 ====================

export interface ProjectInfo {
  name: string;
  description: string;
  role?: string;
  technologies: string[];
  keyContribution?: string;
}

export interface ResumeData {
  name?: string;
  school?: string;
  major?: string;
  gpa?: string;
  projects: ProjectInfo[];
  skills: string[];
  awards?: string[];
  rawText: string;
}

// ==================== 面试配置 ====================

export interface InterviewConfig {
  targetSchool: string;
  targetDirection: string;
  daysUntilInterview: number;
  availableMinutes: number;
  additionalInfo?: string;
}

// ==================== 能力点与证据 ====================

/** 某个子能力的证据记录 */
export interface Evidence {
  ability: string;
  observed: boolean | null;
  detail?: string;
}

/** 原子能力点（最小可诊断单元） */
export interface SubCompetency {
  id: string;
  name: string;
  status: CompetencyStatus;
  evidence: Evidence[];
  lastTestAt?: number;
}

/** 父级能力点（包含多个原子能力） */
export interface Competency {
  id: string;
  name: string;
  category: CompetencyCategory;
  subCompetencies: SubCompetency[];
  priority: number;
  estimatedMinutes: number;
  needsRetest: boolean;
  whyCheck: string; // "为什么检查这一项"——不预测面试官，而是解释对用户的价值
  source: CompetencySource;
  sourceDetail?: string; // e.g. "共同一作科研经历"
}

// ==================== 缺口信息 ====================

export interface GapInfo {
  competencyId: string;
  subCompetencyId: string;
  competencyName: string;
  subCompetencyName: string;
  severity: 'critical' | 'important';
  issue: string;
  userQuote?: string;
  whyDangerous: string;
  repairMinutes: number;
}

// ==================== 对话 ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ==================== API 请求/响应 ====================

export interface AnalyzeRequest {
  resumeText: string;
  config: InterviewConfig;
}

export interface AnalyzeResponse {
  resume: ResumeData;
  competencies: Competency[];
  diagnosticPlan: DiagnosticPlan;
}

/** 10分钟诊断计划：3个不同类型的检查项 */
export interface DiagnosticPlan {
  items: {
    competencyId: string;
    competencyName: string;
    focusSubIds: string[];
    estimatedMinutes: number;
    category: CompetencyCategory;
    whyFirst: string;
  }[];
  totalMinutes: number;
}

export interface ChatRequest {
  messages: { role: string; content: string }[];
  mode: 'diagnostic' | 'repair' | 'retest';
  context: {
    resume?: ResumeData;
    competencies?: Competency[];
    diagnosticPlan?: DiagnosticPlan;
    currentCompetencyId?: string;
    gapInfo?: GapInfo;
  };
}

export interface EvaluateRequest {
  conversation: ChatMessage[];
  competencies: Competency[];
  resume: ResumeData;
  mode: 'diagnostic' | 'retest';
  currentGap?: GapInfo;
}

export interface EvaluateResponse {
  subCompetencyUpdates: {
    competencyId: string;
    subCompetencyId: string;
    status: CompetencyStatus;
    evidence: Evidence[];
  }[];
  topGaps: GapInfo[];
}
