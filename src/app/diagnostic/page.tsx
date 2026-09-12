'use client';

/**
 * 10分钟快速体检 - 诊断页面
 * AI面试官冷测模式，快速找出薄弱点
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ChatInterface } from '@/components/ChatInterface';
import type { ChatMessage } from '@/lib/types';

export default function DiagnosticPage() {
  const router = useRouter();
  const {
    config, resume, competencies,
    diagnosticMessages, addDiagnosticMessage, updateLastDiagnosticMessage,
    setPhase, setGaps, applyEvaluation, setDiagnosticComplete,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [diagnosticDone, setDiagnosticDone] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const hasInitialized = useRef(false);

  // 如果没有数据，回到首页
  useEffect(() => {
    if (!config || !resume || competencies.length === 0) {
      router.push('/');
    }
  }, [config, resume, competencies, router]);

  // 发送消息到AI并获取流式响应
  const sendToAI = useCallback(async (messages: { role: string; content: string }[]) => {
    setIsLoading(true);

    // 创建一个空的 assistant 消息用于流式更新
    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
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
          context: { resume, competencies },
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
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        updateLastDiagnosticMessage(fullText);
      }

      // 检查是否包含诊断完成信号
      if (fullText.includes('[DIAGNOSTIC_COMPLETE]')) {
        // 移除标记
        const cleanText = fullText.replace('[DIAGNOSTIC_COMPLETE]', '').trim();
        updateLastDiagnosticMessage(cleanText);
        setDiagnosticDone(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateLastDiagnosticMessage('抱歉，发生了错误。请刷新页面重试。');
    } finally {
      setIsLoading(false);
    }
  }, [resume, competencies, addDiagnosticMessage, updateLastDiagnosticMessage]);

  // 初始化：发送第一个消息让AI开始提问
  useEffect(() => {
    if (!resume || !competencies.length || hasInitialized.current) return;
    if (diagnosticMessages.length > 0) return; // 如果已有消息就不重新初始化

    hasInitialized.current = true;

    sendToAI([
      { role: 'user', content: '我准备好了，请开始面试。' },
    ]);
  }, [resume, competencies, diagnosticMessages.length, sendToAI]);

  // 处理用户发送消息
  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addDiagnosticMessage(userMsg);

    // 构建完整的历史消息
    const store = useStore.getState();
    const allMessages = [...store.diagnosticMessages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    sendToAI(allMessages);
  }, [addDiagnosticMessage, sendToAI]);

  // 结束诊断并进入评估
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

      // 应用评估结果
      applyEvaluation(data.competencyUpdates || []);
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
        title="快速体检"
        subtitle={`诊断模式 · ${config.targetDirection || 'CS/AI'}`}
        showTimer
        startTime={startTime}
      />

      {/* 结束诊断按钮 */}
      {(diagnosticDone || diagnosticMessages.length >= 6) && (
        <div className="border-t border-gray-100 bg-white p-4">
          <button
            onClick={handleFinishDiagnostic}
            disabled={isEvaluating}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isEvaluating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                正在评估你的表现...
              </span>
            ) : diagnosticDone ? (
              '体检完成，查看结果 →'
            ) : (
              '结束体检，查看已有结果 →'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
