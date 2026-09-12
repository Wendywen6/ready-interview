'use client';

/**
 * 10分钟快速诊断页面
 * AI面试官冷测模式，控制在10分钟内
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ChatInterface } from '@/components/ChatInterface';
import type { ChatMessage } from '@/lib/types';

export default function DiagnosticPage() {
  const router = useRouter();
  const {
    config, resume, competencies, diagnosticPlan,
    diagnosticMessages, addDiagnosticMessage, updateLastDiagnosticMessage,
    setPhase, setGaps, applyEvaluation, setDiagnosticComplete,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [diagnosticDone, setDiagnosticDone] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!config || !resume || competencies.length === 0) router.push('/');
  }, [config, resume, competencies, router]);

  const sendToAI = useCallback(async (messages: { role: string; content: string }[]) => {
    setIsLoading(true);
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    addDiagnosticMessage(assistantMsg);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode: 'diagnostic',
          context: { resume, competencies, diagnosticPlan },
        }),
      });

      if (!res.ok) throw new Error('请求失败');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        updateLastDiagnosticMessage(fullText);
      }

      if (fullText.includes('[DIAGNOSTIC_COMPLETE]')) {
        updateLastDiagnosticMessage(fullText.replace('[DIAGNOSTIC_COMPLETE]', '').trim());
        setDiagnosticDone(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateLastDiagnosticMessage('抱歉，发生了错误。请刷新页面重试。');
    } finally {
      setIsLoading(false);
    }
  }, [resume, competencies, diagnosticPlan, addDiagnosticMessage, updateLastDiagnosticMessage]);

  // 初始化：当消息为空时自动开始诊断
  useEffect(() => {
    if (!resume || !competencies.length) return;
    if (diagnosticMessages.length > 0) return; // 已有消息则不重新开始
    if (hasInitialized.current) {
      // 如果之前初始化过但消息被清空了（用户选了新的测试项），重置标记
      hasInitialized.current = false;
    }
    hasInitialized.current = true;
    setDiagnosticDone(false);
    sendToAI([{ role: 'user', content: '我准备好了，请开始面试。' }]);
  }, [resume, competencies, diagnosticMessages.length, sendToAI, setDiagnosticComplete]);

  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addDiagnosticMessage(userMsg);

    const store = useStore.getState();
    const allMessages = [...store.diagnosticMessages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));
    sendToAI(allMessages);
  }, [addDiagnosticMessage, sendToAI]);

  const handleFinishDiagnostic = async () => {
    setIsEvaluating(true);
    try {
      const store = useStore.getState();
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: store.diagnosticMessages,
          competencies: store.competencies,
          resume: store.resume,
          mode: 'diagnostic',
        }),
      });

      if (!res.ok) throw new Error('评估失败');
      const data = await res.json();

      applyEvaluation(data.subCompetencyUpdates || []);
      setGaps(data.topGaps || []);
      setDiagnosticComplete(true);
      setPhase('gaps');
      router.push('/gaps');
    } catch (error) {
      console.error('Evaluate error:', error);
      alert('评估失败，请重试');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!config || !resume) return null;

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface
        messages={diagnosticMessages}
        onSend={handleSend}
        isLoading={isLoading}
        placeholder="输入你的回答..."
        disabled={diagnosticDone || isEvaluating}
        title="快速诊断"
        subtitle={`冷测模式 · 约${diagnosticPlan?.totalMinutes || 10}分钟`}
        showTimer
        startTime={startTime}
      />

      {(diagnosticDone || diagnosticMessages.length >= 6) && (
        <div className="border-t border-gray-100 bg-white p-4">
          <button onClick={handleFinishDiagnostic} disabled={isEvaluating}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {isEvaluating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                正在评估你的表现...
              </span>
            ) : diagnosticDone ? '诊断完成，查看结果 →' : '结束诊断，查看已有结果 →'}
          </button>
        </div>
      )}
    </div>
  );
}
