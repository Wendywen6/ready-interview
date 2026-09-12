'use client';

/**
 * 流程步骤指示器 — 让用户知道自己走到了哪一步
 */

import { useRouter } from 'next/navigation';

const steps = [
  { id: 'map', label: '攻击面', path: '/map' },
  { id: 'diagnostic', label: '诊断', path: '/diagnostic' },
  { id: 'gaps', label: '漏洞报告', path: '/gaps' },
  { id: 'repair', label: '修复', path: '/repair' },
  { id: 'summary', label: '防御总结', path: '/summary' },
] as const;

type StepId = (typeof steps)[number]['id'];

export function StepIndicator({ current }: { current: StepId }) {
  const router = useRouter();
  const currentIdx = steps.findIndex(s => s.id === current);

  return (
    <div className="flex items-center justify-center gap-1 py-2 px-4 bg-gray-50/80">
      {steps.map((step, i) => {
        const isActive = step.id === current;
        const isPast = i < currentIdx;
        return (
          <div key={step.id} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-200 text-[10px] mx-0.5">›</span>}
            <button
              onClick={() => isPast ? router.push(step.path) : undefined}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white font-medium'
                  : isPast
                    ? 'text-gray-500 hover:text-gray-700 cursor-pointer'
                    : 'text-gray-300 cursor-default'
              }`}
            >
              {step.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
