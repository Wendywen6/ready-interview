'use client';

import type { CompetencyStatus } from '@/lib/types';

const statusConfig: Record<CompetencyStatus, { icon: string; label: string; className: string }> = {
  unknown: {
    icon: '⚪',
    label: '未验证',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  weak: {
    icon: '🔴',
    label: '薄弱',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  pending: {
    icon: '🟡',
    label: '待复测',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  ready: {
    icon: '🟢',
    label: 'Ready',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
};

export function StatusBadge({ status }: { status: CompetencyStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
