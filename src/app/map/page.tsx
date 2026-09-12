'use client';

/**
 * Interview Map 页面
 * 核心改动：X/Y已验证指标 + 10分钟诊断计划 + 父子层级展示 + 来源标签
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, countAllSubs } from '@/lib/store';
import { CompetencyCard } from '@/components/CompetencyCard';
import type { DiagnosticPlan } from '@/lib/types';

const sourceLabels: Record<string, { text: string; className: string }> = {
  resume: { text: '来自简历', className: 'bg-blue-50 text-blue-600' },
  target: { text: '来自你的目标', className: 'bg-purple-50 text-purple-600' },
  general: { text: '通用检查项', className: 'bg-gray-100 text-gray-500' },
  official: { text: '官方要求', className: 'bg-orange-50 text-orange-600' },
};

export default function MapPage() {
  const router = useRouter();
  const { config, competencies, diagnosticPlan, setPhase } = useStore();

  useEffect(() => {
    if (!config || competencies.length === 0) router.push('/');
  }, [config, competencies, router]);

  if (!config || competencies.length === 0) return null;

  const sorted = [...competencies].sort((a, b) => a.priority - b.priority);
  const stats = countAllSubs(competencies);

  const handleStartDiagnostic = () => {
    setPhase('diagnostic');
    router.push('/diagnostic');
  };

  // 点击单个能力点，直接针对它开始诊断
  const handleTestSingle = useCallback((competencyId: string) => {
    const comp = competencies.find(c => c.id === competencyId);
    if (!comp) return;

    const singlePlan: DiagnosticPlan = {
      items: [{
        competencyId: comp.id,
        competencyName: comp.name,
        focusSubIds: comp.subCompetencies.map(s => s.id),
        estimatedMinutes: comp.estimatedMinutes,
        category: comp.category,
        whyFirst: comp.whyCheck,
      }],
      totalMinutes: comp.estimatedMinutes,
    };

    // 更新诊断计划为单项，清空旧消息，然后跳转
    const store = useStore.getState();
    store.setDiagnosticPlan(singlePlan);
    store.setDiagnosticComplete(false);
    // 通过 set 清空消息（直接修改 zustand state）
    useStore.setState({ diagnosticMessages: [] });
    setPhase('diagnostic');
    router.push('/diagnostic');
  }, [competencies, setPhase, router]);

  return (
    <div className="min-h-screen pb-24">
      {/* 头部 */}
      <div className="px-4 pt-8 pb-2">
        <button onClick={() => { useStore.getState().reset(); router.push('/'); }}
          className="text-xs text-gray-400 hover:text-gray-600 mb-4 inline-block">
          ← 重新配置
        </button>
        <h1 className="text-xl font-bold text-gray-900">你的复试准备地图</h1>
        <p className="mt-1 text-sm text-gray-500">
          面试还有 <span className="font-semibold text-gray-700">{config.daysUntilInterview} 天</span>
          {' · '}今天有 <span className="font-semibold text-gray-700">{config.availableMinutes} 分钟</span>
        </p>
      </div>

      {/* 核心指标：风险导向，不是进度条 */}
      <div className="px-4 mb-6 mt-4">
        <div className="bg-gray-50 rounded-2xl p-5">
          <div className="space-y-2">
            {stats.ready > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-green-500">🟢</span>
                <span className="text-sm text-gray-700">已排除 <span className="font-bold text-green-700">{stats.ready}</span> 个高优先级风险</span>
              </div>
            )}
            {stats.weak > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-red-500">🔴</span>
                <span className="text-sm text-gray-700">发现 <span className="font-bold text-red-700">{stats.weak}</span> 个明确缺口</span>
              </div>
            )}
            {stats.pending > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">🟡</span>
                <span className="text-sm text-gray-700"><span className="font-bold text-yellow-700">{stats.pending}</span> 个初测通过，待复测确认</span>
              </div>
            )}
            {stats.unknown > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">⚪</span>
                <span className="text-sm text-gray-500">{stats.unknown} 个能力尚未检查</span>
              </div>
            )}
          </div>
          {stats.verified === 0 && (
            <p className="text-xs text-gray-400 mt-3">还没有开始诊断。先用 10 分钟找出最值得补的地方。</p>
          )}
        </div>
      </div>

      {/* 10分钟诊断计划 */}
      {diagnosticPlan && diagnosticPlan.items.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              先用 {diagnosticPlan.totalMinutes} 分钟找出今天最值得补的地方
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              我们不会把所有内容都练一遍。先从不同类型各抽一个关键点，快速判断薄弱区。
            </p>

            <div className="mt-4 space-y-4">
              {diagnosticPlan.items.map((item, i) => {
                const source = sourceLabels[competencies.find(c => c.id === item.competencyId)?.source || 'general'];
                return (
                  <div key={item.competencyId} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-300 mt-0.5 w-5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {item.competencyName}
                          </span>
                          <span className="text-xs text-gray-400">约 {item.estimatedMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${source.className}`}>
                            {source.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          {item.whyFirst}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 完整准备地图 */}
      <div className="px-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          完整准备地图
        </h2>
        <div className="space-y-3">
          {sorted.map((c, i) => (
            <div key={c.id}>
              <CompetencyCard competency={c} index={i} />
              {/* 单项测试按钮 — 放在卡片下方 */}
              {c.subCompetencies.some(s => s.status === 'unknown') && (
                <div className="flex justify-end -mt-1 mb-1 pr-1">
                  <button
                    onClick={() => handleTestSingle(c.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                  >
                    单项测试 →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <button onClick={handleStartDiagnostic}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
            开始 {diagnosticPlan?.totalMinutes || 10} 分钟快速诊断
          </button>
        </div>
      </div>
    </div>
  );
}
