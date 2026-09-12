'use client';

/**
 * 总结页 - 今天的准备结论
 * 三层分离：必须修复 / 下一轮确认 / 不用再练
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, countAllSubs } from '@/lib/store';
import { StepIndicator } from '@/components/StepIndicator';

export default function SummaryPage() {
  const router = useRouter();
  const { config, competencies, gaps } = useStore();
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const weakSubs = competencies.flatMap(c =>
      c.subCompetencies.filter(s => s.status === 'weak').map(s => `🔴 ${c.name} > ${s.name}`)
    );
    const readySubs = competencies.flatMap(c =>
      c.subCompetencies.filter(s => s.status === 'ready').map(s => `🟢 ${c.name} > ${s.name}`)
    );
    const pendingSubs = competencies.flatMap(c =>
      c.subCompetencies.filter(s => s.status === 'pending').map(s => `🟡 ${c.name} > ${s.name}`)
    );

    const text = [
      `【Ready 准备度总结】`,
      `面试还有 ${config?.daysUntilInterview} 天`,
      '',
      weakSubs.length > 0 ? `⚠️ 需要修复：\n${weakSubs.join('\n')}` : '',
      pendingSubs.length > 0 ? `\n🟡 待复测：\n${pendingSubs.join('\n')}` : '',
      readySubs.length > 0 ? `\n✅ 已排除风险：\n${readySubs.join('\n')}` : '',
      advice ? `\n💡 建议：${advice}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [competencies, config, advice]);

  useEffect(() => {
    if (!config || competencies.length === 0) router.push('/');
  }, [config, competencies, router]);

  // AI 建议
  useEffect(() => {
    if (!config || competencies.length === 0) return;
    const fetchAdvice = async () => {
      setIsLoadingAdvice(true);
      try {
        const weakSubs = competencies.flatMap(c =>
          c.subCompetencies.filter(s => s.status === 'weak').map(s => `${c.name}>${s.name}`)
        );
        const readySubs = competencies.flatMap(c =>
          c.subCompetencies.filter(s => s.status === 'ready').map(s => `${c.name}>${s.name}`)
        );
        const unknownHighPri = competencies
          .filter(c => c.priority <= 3)
          .flatMap(c => c.subCompetencies.filter(s => s.status === 'unknown').map(s => `${c.name}>${s.name}`));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `距面试${config.daysUntilInterview}天。给出一句话建议（不超过80字）。
已确认缺口(${weakSubs.length})：${weakSubs.join('、') || '无'}
已排除风险(${readySubs.length})：${readySubs.join('、') || '无'}
高优先级未检查(${unknownHighPri.length})：${unknownHighPri.join('、') || '无'}
告诉用户下一步该做什么，什么不用再练。不要用"必然""必问"。直接给建议。`,
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
      } catch { setAdvice('先处理已确认的缺口，再逐步确认高优先级未知项。'); }
      finally { setIsLoadingAdvice(false); }
    };
    fetchAdvice();
  }, [config, competencies, gaps]);

  if (!config || competencies.length === 0) return null;

  const stats = countAllSubs(competencies);

  // 三层分离
  const confirmedGaps = competencies.flatMap(c =>
    c.subCompetencies.filter(s => s.status === 'weak').map(s => ({
      parent: c, sub: s,
      gap: gaps.find(g => g.subCompetencyId === s.id),
    }))
  );

  const highPriUnknown = competencies
    .filter(c => c.priority <= 4)
    .flatMap(c =>
      c.subCompetencies.filter(s => s.status === 'unknown').map(s => ({ parent: c, sub: s }))
    )
    .slice(0, 6);

  const readyItems = competencies.flatMap(c =>
    c.subCompetencies.filter(s => s.status === 'ready').map(s => ({ parent: c, sub: s }))
  );

  const pendingItems = competencies.flatMap(c =>
    c.subCompetencies.filter(s => s.status === 'pending').map(s => ({ parent: c, sub: s }))
  );

  return (
    <div className="min-h-screen pb-24">
      <StepIndicator current="summary" />
      {/* 头部 */}
      <div className="px-4 pt-6 pb-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">防御状态总结</h1>
        <p className="mt-1 text-sm text-gray-400">
          面试还有 {config.daysUntilInterview} 天
        </p>
      </div>

      {/* 核心摘要 — 风险导向 */}
      <div className="px-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
          {stats.ready > 0 && (
            <div className="flex items-center gap-2">
              <span>🟢</span>
              <span className="text-sm text-gray-700">排除 <span className="font-bold text-green-700">{stats.ready}</span> 个高优先级风险</span>
            </div>
          )}
          {stats.weak > 0 && (
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span className="text-sm text-gray-700">发现 <span className="font-bold text-red-700">{stats.weak}</span> 个明确缺口</span>
            </div>
          )}
          {stats.pending > 0 && (
            <div className="flex items-center gap-2">
              <span>🟡</span>
              <span className="text-sm text-gray-700"><span className="font-bold text-yellow-700">{stats.pending}</span> 个初测通过，待复测</span>
            </div>
          )}
          {highPriUnknown.length > 0 && (
            <div className="flex items-center gap-2">
              <span>⚪</span>
              <span className="text-sm text-gray-500">{highPriUnknown.length} 个高优先级能力值得下一轮确认</span>
            </div>
          )}
        </div>
      </div>

      {/* 第一层：必须修复 */}
      {confirmedGaps.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">
            🔴 现在最需要修复
          </h2>
          <div className="space-y-3">
            {confirmedGaps.map(({ parent, sub, gap }, i) => (
              <div key={sub.id} className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{parent.name} &gt; {sub.name}</span>
                </div>
                {gap && (
                  <>
                    <p className="text-xs text-gray-600 mt-1">{gap.issue}</p>
                    {gap.whyDangerous && (
                      <p className="text-xs text-red-600 mt-1 italic">{gap.whyDangerous}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 第二层：下一轮优先确认 */}
      {highPriUnknown.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            ⚪ 下一轮优先确认
          </h2>
          <div className="space-y-1.5">
            {highPriUnknown.map(({ parent, sub }) => (
              <div key={sub.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-xs text-gray-400">⚪</span>
                <span className="text-xs text-gray-600">{parent.name} &gt; {sub.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 pl-1">
            这些目前是 Unknown，<span className="font-medium">不代表薄弱</span>，只是尚未检查。
          </p>
        </div>
      )}

      {/* 初测通过待复测 */}
      {pendingItems.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-3">
            🟡 初测通过，待复测确认
          </h2>
          <div className="space-y-1.5">
            {pendingItems.map(({ parent, sub }) => (
              <div key={sub.id} className="flex items-center gap-2 bg-yellow-50 rounded-lg px-4 py-2.5">
                <span className="text-xs">🟡</span>
                <span className="text-xs text-gray-600">{parent.name} &gt; {sub.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 第三层：不用再练 */}
      {readyItems.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">
            🟢 今天不用再练
          </h2>
          <div className="space-y-1.5">
            {readyItems.map(({ parent, sub }) => (
              <div key={sub.id} className="flex items-center gap-2 bg-green-50/50 rounded-lg px-4 py-2.5">
                <span className="text-xs text-green-500">✓</span>
                <span className="text-xs text-gray-600">{parent.name} &gt; {sub.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 pl-1">当前轮次中已稳定通过，不建议继续消耗时间。</p>
        </div>
      )}

      {/* AI 建议 */}
      <div className="px-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-5 text-white">
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

      {/* 收尾语 */}
      <div className="px-4 mb-8">
        <p className="text-xs text-gray-400 leading-relaxed text-center">
          你不需要把所有能力全部刷完。<br/>
          距面试 {config.daysUntilInterview} 天，
          先处理{confirmedGaps.length > 0 ? ` ${confirmedGaps.length} 个明确缺口` : '已确认风险'}，
          再确认高优先级未知项。
        </p>
      </div>

      {/* 底部操作 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex gap-3">
            <button onClick={() => router.push('/map')}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              返回准备地图
            </button>
            <button onClick={() => { useStore.getState().reset(); router.push('/'); }}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
              重新开始
            </button>
          </div>
          <button onClick={handleCopy}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors">
            {copied ? '✅ 已复制到剪贴板' : '📋 复制总结发给自己'}
          </button>
        </div>
      </div>
    </div>
  );
}
