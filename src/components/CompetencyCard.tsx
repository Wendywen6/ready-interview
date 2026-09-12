'use client';

import { useState } from 'react';
import type { Competency } from '@/lib/types';

interface CompetencyCardProps {
  competency: Competency;
  index?: number;
  showPriority?: boolean;
  defaultExpanded?: boolean;
}

const categoryLabels: Record<string, string> = {
  project: '科研经历', foundation: '基础知识', direction: '研究方向',
  expression: '表达能力', engineering: '工程/创业经历',
};

const sourceLabels: Record<string, { text: string; className: string }> = {
  resume: { text: '来自简历', className: 'bg-blue-50 text-blue-600 border-blue-100' },
  target: { text: '来自你的目标', className: 'bg-purple-50 text-purple-600 border-purple-100' },
  general: { text: '通用检查项', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  official: { text: '官方要求', className: 'bg-orange-50 text-orange-600 border-orange-100' },
};

/** 父级不用四状态，只显示进度摘要 */
function ParentSummary({ competency }: { competency: Competency }) {
  const subs = competency.subCompetencies;
  const verified = subs.filter(s => s.status !== 'unknown').length;
  const weak = subs.filter(s => s.status === 'weak').length;
  const total = subs.length;

  if (weak > 0) {
    return (
      <span className="text-xs text-red-600 font-medium">
        🔴 {weak} 个缺口 · {verified}/{total} 已检查
      </span>
    );
  }
  if (verified === total) {
    return <span className="text-xs text-green-600 font-medium">🟢 全部已验证</span>;
  }
  if (verified > 0) {
    return (
      <span className="text-xs text-gray-500">
        {verified} 已验证 · {total - verified} 待评估
      </span>
    );
  }
  return <span className="text-xs text-gray-400">⚪ {total} 项待评估</span>;
}

export function CompetencyCard({ competency, index, showPriority = true, defaultExpanded = false }: CompetencyCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const source = sourceLabels[competency.source] || sourceLabels.general;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-all">
      {/* 父级头部 */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {showPriority && index !== undefined && (
                <span className="text-xs font-bold text-gray-300 w-5">
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              <h3 className="text-sm font-semibold text-gray-900 truncate">{competency.name}</h3>
            </div>

            {/* 来源标签 + 类别 */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${source.className}`}>
                {source.text}
              </span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">
                {categoryLabels[competency.category] || competency.category}
              </span>
              {competency.sourceDetail && (
                <>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{competency.sourceDetail}</span>
                </>
              )}
            </div>

            {competency.whyCheck && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{competency.whyCheck}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ParentSummary competency={competency} />
            <svg
              className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 子能力点列表 */}
      {expanded && competency.subCompetencies.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/30 px-4 py-3 space-y-1.5">
          {competency.subCompetencies.map((sub) => {
            const icon = sub.status === 'ready' ? '🟢' : sub.status === 'weak' ? '🔴' : sub.status === 'pending' ? '🟡' : '⚪';
            const label = sub.status === 'ready' ? 'Ready' : sub.status === 'weak' ? 'Weak' : sub.status === 'pending' ? '初测通过' : '待评估';
            return (
              <div key={sub.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{icon}</span>
                  <span className="text-xs text-gray-700">{sub.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  sub.status === 'ready' ? 'bg-green-100 text-green-600' :
                  sub.status === 'weak' ? 'bg-red-100 text-red-600' :
                  sub.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-400'
                }`}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
