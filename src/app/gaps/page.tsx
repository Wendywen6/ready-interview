'use client';

/**
 * Gap Report 页面
 * 展示诊断出的 Top 缺口，以及不需要再练的项目
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CompetencyCard } from '@/components/CompetencyCard';

export default function GapsPage() {
  const router = useRouter();
  const { config, competencies, gaps, setRepairTargetGap, setPhase } = useStore();

  useEffect(() => {
    if (!config || competencies.length === 0) {
      router.push('/');
    }
  }, [config, competencies, router]);

  if (!config || competencies.length === 0) return null;

  const readyItems = competencies.filter(c => c.status === 'ready');
  const weakItems = competencies.filter(c => c.status === 'weak');
  const unknownItems = competencies.filter(c => c.status === 'unknown');

  const handleStartRepair = (gapId: string) => {
    setRepairTargetGap(gapId);
    setPhase('repair');
    router.push('/repair');
  };

  const handleGoToSummary = () => {
    setPhase('summary');
    router.push('/summary');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 头部 */}
      <div className="px-4 pt-8 pb-2">
        <h1 className="text-xl font-bold text-gray-900">
          你现在最值得解决的问题
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          基于刚才的体检对话分析得出
        </p>
      </div>

      {/* Top Gaps */}
      {gaps.length > 0 && (
        <div className="px-4 mt-6 space-y-4">
          {gaps.map((gap, i) => (
            <div
              key={gap.competencyId}
              className="border border-red-200 bg-red-50/50 rounded-xl p-5 animate-slide-up"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔴</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      {gap.severity === 'critical' ? '关键' : '重要'}
                    </span>
                    <span className="text-xs text-gray-400">{gap.repairMinutes} min 修复</span>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 mt-2">
                    {gap.issue}
                  </h3>

                  {gap.userQuote && (
                    <div className="mt-2 bg-white/80 rounded-lg px-3 py-2 border border-red-100">
                      <p className="text-xs text-gray-400 mb-1">你刚刚说：</p>
                      <p className="text-sm text-gray-600 italic">&ldquo;{gap.userQuote}&rdquo;</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-xs font-medium text-red-700 mb-1">为什么危险</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {gap.whyDangerous}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartRepair(gap.competencyId)}
                    className="mt-4 w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    {gap.repairMinutes} 分钟修复 →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 暂时不用再练 */}
      {readyItems.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            🟢 暂时不用再练
          </h2>
          <div className="space-y-2">
            {readyItems.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-green-50/50 rounded-lg px-4 py-3">
                <span className="text-green-500">✓</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{c.name}</p>
                  {c.evidence.filter(e => e.observed).length > 0 && (
                    <p className="text-xs text-green-600 mt-0.5">
                      冷测通过：{c.evidence.filter(e => e.observed).map(e => e.ability).join('、')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-2 pl-1">
              今天不建议继续练习这些项目。
            </p>
          </div>
        </div>
      )}

      {/* 未检查到的 */}
      {unknownItems.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            ⚪ 尚未检查
          </h2>
          <div className="space-y-2">
            {unknownItems.map(c => (
              <CompetencyCard key={c.id} competency={c} showPriority={false} />
            ))}
          </div>
        </div>
      )}

      {/* 底部操作 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {gaps.length > 0 ? (
            <>
              <button
                onClick={() => handleStartRepair(gaps[0].competencyId)}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                修复最高优先缺口 →
              </button>
              <button
                onClick={handleGoToSummary}
                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                查看总结
              </button>
            </>
          ) : (
            <button
              onClick={handleGoToSummary}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              查看今日总结 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
