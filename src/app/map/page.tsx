'use client';

/**
 * Interview Map 页面
 * 展示面试准备地图 + 推荐今天优先检查的能力点
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CompetencyCard } from '@/components/CompetencyCard';

export default function MapPage() {
  const router = useRouter();
  const { config, competencies, setPhase } = useStore();

  // 如果没有数据，回到首页
  useEffect(() => {
    if (!config || competencies.length === 0) {
      router.push('/');
    }
  }, [config, competencies, router]);

  if (!config || competencies.length === 0) return null;

  // 按优先级排序
  const sorted = [...competencies].sort((a, b) => a.priority - b.priority);

  // 统计各状态数量
  const stats = {
    total: competencies.length,
    unknown: competencies.filter(c => c.status === 'unknown').length,
    weak: competencies.filter(c => c.status === 'weak').length,
    pending: competencies.filter(c => c.status === 'pending').length,
    ready: competencies.filter(c => c.status === 'ready').length,
  };

  // 推荐今天先检查的（前3个未验证的）
  const recommended = sorted.filter(c => c.status === 'unknown').slice(0, 3);
  const totalRecommendedMinutes = recommended.reduce((sum, c) => sum + c.estimatedMinutes, 0);

  const handleStartDiagnostic = () => {
    setPhase('diagnostic');
    router.push('/diagnostic');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 头部 */}
      <div className="px-4 pt-8 pb-6">
        <button
          onClick={() => router.push('/')}
          className="text-xs text-gray-400 hover:text-gray-600 mb-4 inline-block"
        >
          ← 重新配置
        </button>

        <h1 className="text-xl font-bold text-gray-900">
          你的复试准备地图
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          面试还有 <span className="font-semibold text-gray-700">{config.daysUntilInterview} 天</span>
          {' · '}今天有 <span className="font-semibold text-gray-700">{config.availableMinutes} 分钟</span>
        </p>
      </div>

      {/* 状态概览 */}
      <div className="px-4 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-gray-300">{stats.unknown}</div>
            <div className="text-xs text-gray-400">未验证</div>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-red-600">{stats.weak}</div>
            <div className="text-xs text-red-500">薄弱</div>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-yellow-500">待复测</div>
          </div>
          <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-green-600">{stats.ready}</div>
            <div className="text-xs text-green-500">Ready</div>
          </div>
        </div>
      </div>

      {/* 推荐优先检查 */}
      {recommended.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              今天先检查这 {recommended.length} 项
            </h2>

            <div className="space-y-2">
              {recommended.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-gray-400 w-6">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium text-gray-800 flex-1">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.estimatedMinutes} min</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400">
              预计总时间：{totalRecommendedMinutes} 分钟
            </div>
          </div>
        </div>
      )}

      {/* 全部能力点 */}
      <div className="px-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          完整能力点列表
        </h2>
        <div className="space-y-3">
          {sorted.map((c, i) => (
            <CompetencyCard key={c.id} competency={c} index={i} />
          ))}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleStartDiagnostic}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
          >
            开始 {totalRecommendedMinutes} 分钟快速体检
          </button>
        </div>
      </div>
    </div>
  );
}
