'use client';

/**
 * 总结页面 - 今天的准备完成情况
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, countAllSubs, deriveParentStatus } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';

export default function SummaryPage() {
  const router = useRouter();
  const { config, competencies, gaps } = useStore();
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    if (!config || competencies.length === 0) router.push('/');
  }, [config, competencies, router]);

  useEffect(() => {
    if (!config || competencies.length === 0) return;
    const fetchAdvice = async () => {
      setIsLoadingAdvice(true);
      try {
        const allSubs = competencies.flatMap(c =>
          c.subCompetencies.map(s => `- ${c.name} > ${s.name}: ${s.status}`)
        ).join('\n');
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `基于以下准备情况给出简短建议（不超过150字）。距面试${config.daysUntilInterview}天。\n${allSubs}\n${gaps.length > 0 ? `主要缺口：${gaps.map(g => g.issue).join('、')}` : ''}\n直接给建议。告诉用户高优先级准备是否完成，还有时间该做什么，什么不需要再练。不要用"必然""必问"。`,
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
      } catch { setAdvice('继续保持练习，重点关注诊断出的薄弱环节。'); }
      finally { setIsLoadingAdvice(false); }
    };
    fetchAdvice();
  }, [config, competencies, gaps]);

  if (!config || competencies.length === 0) return null;

  const stats = countAllSubs(competencies);
  const sorted = [...competencies].sort((a, b) => a.priority - b.priority);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-10 pb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">今天的准备完成情况</h1>
        <p className="mt-1 text-sm text-gray-500">面试还有 {config.daysUntilInterview} 天</p>
      </div>

      {/* 核心指标 */}
      <div className="px-4 mb-8">
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-gray-900">
            {stats.verified} <span className="text-lg text-gray-400 font-normal">/ {stats.total}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">个重点能力已验证</p>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span className="text-green-500">🟢 {stats.ready} Ready</span>
            <span className="text-red-500">🔴 {stats.weak} Weak</span>
            <span className="text-yellow-500">🟡 {stats.pending} Pending</span>
            <span className="text-gray-400">⚪ {stats.unknown} Unknown</span>
          </div>
        </div>
      </div>

      {/* 按父级能力分组展示 */}
      {sorted.map(c => {
        const parentStatus = deriveParentStatus(c.subCompetencies);
        if (c.subCompetencies.every(s => s.status === 'unknown')) return null;
        return (
          <div key={c.id} className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">{c.name}</h3>
              <StatusBadge status={parentStatus} />
            </div>
            <div className="space-y-1.5">
              {c.subCompetencies.map(s => {
                const icon = s.status === 'ready' ? '🟢' : s.status === 'weak' ? '🔴' : s.status === 'pending' ? '🟡' : '⚪';
                return (
                  <div key={s.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    s.status === 'ready' ? 'bg-green-50' :
                    s.status === 'weak' ? 'bg-red-50' :
                    s.status === 'pending' ? 'bg-yellow-50' :
                    'bg-gray-50'
                  }`}>
                    <span className="text-xs text-gray-700">{icon} {s.name}</span>
                    <span className={`text-[10px] ${
                      s.status === 'ready' ? 'text-green-600' :
                      s.status === 'weak' ? 'text-red-600' :
                      s.status === 'pending' ? 'text-yellow-600' :
                      'text-gray-400'
                    }`}>
                      {s.status === 'ready' ? 'Ready' : s.status === 'weak' ? 'Weak' : s.status === 'pending' ? 'Pending' : '未验证'}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* 该父级的 gap 信息 */}
            {gaps.filter(g => g.competencyId === c.id).map(g => (
              <p key={g.subCompetencyId} className="text-xs text-red-600 mt-1 pl-1">⚠ {g.issue}</p>
            ))}
          </div>
        );
      })}

      {/* AI 建议 */}
      <div className="px-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 text-white">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ready 的建议</h3>
          {isLoadingAdvice ? (
            <div className="flex gap-1 py-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{advice}</p>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={() => router.push('/map')}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            返回准备地图
          </button>
          <button onClick={() => { useStore.getState().reset(); router.push('/'); }}
            className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}
