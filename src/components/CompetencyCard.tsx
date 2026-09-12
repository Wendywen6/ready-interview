'use client';

import type { Competency } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

interface CompetencyCardProps {
  competency: Competency;
  index?: number;
  showPriority?: boolean;
  onClick?: () => void;
}

const categoryLabels: Record<string, string> = {
  project: '科研项目',
  foundation: '基础知识',
  direction: '研究方向',
  expression: '表达能力',
};

export function CompetencyCard({ competency, index, showPriority = true, onClick }: CompetencyCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group border rounded-xl p-4 transition-all ${
        onClick ? 'cursor-pointer hover:border-gray-400 hover:shadow-sm' : ''
      } ${
        competency.status === 'weak'
          ? 'border-red-200 bg-red-50/30'
          : competency.status === 'ready'
          ? 'border-green-200 bg-green-50/30'
          : competency.status === 'pending'
          ? 'border-yellow-200 bg-yellow-50/30'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {showPriority && index !== undefined && (
              <span className="text-xs font-bold text-gray-400 w-5">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {competency.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-400">
              {categoryLabels[competency.category] || competency.category}
            </span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">
              预计 {competency.estimatedMinutes} min
            </span>
          </div>

          {competency.whyPriority && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {competency.whyPriority}
            </p>
          )}
        </div>

        <StatusBadge status={competency.status} />
      </div>

      {/* 证据摘要（如果有） */}
      {competency.evidence.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {competency.evidence.map((e, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded ${
                  e.observed === true
                    ? 'bg-green-100 text-green-700'
                    : e.observed === false
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {e.observed === true ? '✓' : e.observed === false ? '✗' : '?'} {e.ability}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
