'use client';

/**
 * 总结页面 - 今天的准备完成情况
 * 最终展示页面，告诉用户"今天可以停在哪里"
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';

export default function SummaryPage() {
  const router = useRouter();
  const { config, competencies, gaps } = useStore();
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    if (!config || competencies.length === 0) {
      router.push('/');
    }
  }, [config, competencies, router]);

  // 获取AI建议
  useEffect(() => {
    if (!config || competencies.length === 0) return;

    const fetchAdvice = async () => {
      setIsLoadingAdvice(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `基于以下准备情况，给出简短建议（不超过150字）。
距面试${config.daysUntilInterview}天。
能力点状态：
${competencies.map(c => `- ${c.name}: ${c.status}`).join('\n')}
${gaps.length > 0 ? `\n主要缺口：${gaps.map(g => g.issue).join('、')}` : ''}
请直接给出建议，不要重复上述信息。告诉用户今天高优先级准备是否完成，如果还有时间该做什么，以及什么不需要再练。`,
            }],
            mode: 'diagnostic',
            context: { resume: useStore.getState().resume, competencies },
          }),
        });

        if (res.ok) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let text = '';
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              text += decoder.decode(value, { stream: true });
              setAdvice(text);
            }
          }
        }
      } catch {
        setAdvice('继续保持练习，重点关注诊断出的薄弱环节。');
      } finally {
        setIsLoadingAdvice(false);
      }
    };

    fetchAdvice();
  }, [config, competencies, gaps]);

  if (!config || competencies.length === 0) return null;

  const readyItems = competencies.filter(c => c.status === 'ready');
  const weakItems = competencies.filter(c => c.status === 'weak');
  const pendingItems = competencies.filter(c => c.status === 'pending');
  const unknownItems = competencies.filter(c => c.status === 'unknown');

  const testedCount = competencies.filter(c => c.status !== 'unknown').length;

  return (
    <div className="min-h-screen pb-24">
      {/* 头部 */}
      <div className="px-4 pt-10 pb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          今天的准备完成情况
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          面试还有 {config.daysUntilInterview} 天
        </p>
      </div>

      {/* 核心指标 */}
      <div className="px-4 mb-8">
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-gray-900">
            {testedCount} / {competencies.length}
          </div>
          <p className="mt-1 text-sm text-gray-500">个高优先级项已验证</p>

          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{readyItems.length}</div>
              <div className="text-xs text-gray-400">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{weakItems.length}</div>
              <div className="text-xs text-gray-400">Weak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{pendingItems.length}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-300">{unknownItems.length}</div>
              <div className="text-xs text-gray-400">Unknown</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready 项目 */}
      {readyItems.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">
            🟢 Ready
          </h2>
          <div className="space-y-2">
            {readyItems.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">{c.name}</span>
                </div>
                <StatusBadge status="ready" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending 项目 */}
      {pendingItems.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-3">
            🟡 需要之后复测
          </h2>
          <div className="space-y-2">
            {pendingItems.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-yellow-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700">{c.name}</span>
                <StatusBadge status="pending" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak 项目 */}
      {weakItems.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">
            🔴 现在最重要的缺口
          </h2>
          <div className="space-y-2">
            {weakItems.map(c => {
              const gap = gaps.find(g => g.competencyId === c.id);
              return (
                <div key={c.id} className="bg-red-50 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{c.name}</span>
                    <StatusBadge status="weak" />
                  </div>
                  {gap && (
                    <p className="text-xs text-red-600 mt-1">{gap.issue}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 尚未检查 */}
      {unknownItems.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            ⚪ 尚未检查
          </h2>
          <div className="space-y-2">
            {unknownItems.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-500">{c.name}</span>
                <StatusBadge status="unknown" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 建议 */}
      <div className="px-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 text-white">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Ready 的建议
          </h3>
          {isLoadingAdvice ? (
            <div className="flex gap-1 py-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {advice}
            </p>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => router.push('/map')}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            返回准备地图
          </button>
          <button
            onClick={() => {
              useStore.getState().reset();
              router.push('/');
            }}
            className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}
