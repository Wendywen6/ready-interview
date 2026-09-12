/**
 * Ready - 保研面试准备度分诊
 * 核心数据类型定义
 */

// ==================== 能力点状态 ====================

/** 能力点的四种状态 */
export type CompetencyStatus = 'unknown' | 'weak' | 'pending' | 'ready';

/** 能力点所属类别 */
export type CompetencyCategory = 'project' | 'foundation' | 'direction' | 'expression';

/** 产品阶段 */
export type Phase = 'setup' | 'map' | 'diagnostic' | 'gaps' | 'repair' | 'retest' | 'summary';

// ==================== 简历相关 ====================

/** 项目/科研经历 */
export interface ProjectInfo {
  name: string;
  description: string;
  role?: string;
  technologies: string[];
  keyContribution?: string;
}

/** 解析后的简历数据 */
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
  observed: boolean | null; // null=未测, true=观察到, false=未观察到
  detail?: string;
}

/** 一个能力点 */
export interface Competency {
  id: string;
  name: string;
  category: CompetencyCategory;
  status: CompetencyStatus;
  evidence: Evidence[];
  priority: number; // 1 = 最高
  estimatedMinutes: number;
  lastTestAt?: number;
  needsRetest: boolean;
  whyPriority?: string;
}

// ==================== 缺口信息 ====================

export interface GapInfo {
  competencyId: string;
  competencyName: string;
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
}

export interface ChatRequest {
  messages: { role: string; content: string }[];
  mode: 'diagnostic' | 'repair' | 'retest';
  context: {
    resume?: ResumeData;
    competencies?: Competency[];
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
  competencyUpdates: {
    competencyId: string;
    status: CompetencyStatus;
    evidence: Evidence[];
  }[];
  topGaps: GapInfo[];
}
