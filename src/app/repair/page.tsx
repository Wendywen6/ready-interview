'use client';

/**
 * Gap Repair 页面 - 训练模式 + 延迟复测
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ChatInterface } from '@/components/ChatInterface';
import { StepIndicator } from '@/components/StepIndicator';
import type { ChatMessage } from '@/lib/types';

type RepairPhase = 'repair' | 'retest' | 'done';

export default function RepairPage() {
  const router = useRouter();
  const {
    config, resume, gaps, repairTargetGapId,
    repairMessages, addRepairMessage, updateLastRepairMessage, clearRepairMessages,
    updateSubCompetencyStatus, setPhase, competencies,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<RepairPhase>('repair');
  const [retestResult, setRetestResult] = useState<'pass' | 'fail' | null>(null);
  const hasInitialized = useRef(false);

  const currentGap = gaps.find(g => g.competencyId === repairTargetGapId) || gaps[0];

  useEffect(() => {
    if (!config || !resume || !currentGap) router.push('/gaps');
  }, [config, resume, currentGap, router]);

  const sendToAI = useCallback(async (messages: { role: string; content: string }[], mode: 'repair' | 'retest') => {
    setIsLoading(true);
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now(),
    };
    addRepairMessage(assistantMsg);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages, mode,
          context: { resume, gapInfo: currentGap },
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
        updateLastRepairMessage(fullText);
      }

      if (fullText.includes('[REPAIR_COMPLETE]')) {
        updateLastRepairMessage(fullText.replace('[REPAIR_COMPLETE]', '').trim());
        if (currentGap) {
          updateSubCompetencyStatus(currentGap.competencyId, currentGap.subCompetencyId, 'pending');
        }
        setCurrentPhase('retest');
      } else if (fullText.includes('[RETEST_PASS]')) {
        updateLastRepairMessage(fullText.replace('[RETEST_PASS]', '').trim());
        if (currentGap) {
          updateSubCompetencyStatus(currentGap.competencyId, currentGap.subCompetencyId, 'ready');
        }
        setRetestResult('pass');
        setCurrentPhase('done');
      } else if (fullText.includes('[RETEST_FAIL]')) {
        updateLastRepairMessage(fullText.replace('[RETEST_FAIL]', '').trim());
        if (currentGap) {
          updateSubCompetencyStatus(currentGap.competencyId, currentGap.subCompetencyId, 'weak');
        }
        setRetestResult('fail');
        setCurrentPhase('done');
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateLastRepairMessage('抱歉，发生了错误。请刷新页面重试。');
    } finally {
      setIsLoading(false);
    }
  }, [resume, currentGap, addRepairMessage, updateLastRepairMessage, updateSubCompetencyStatus]);

  useEffect(() => {
    if (!resume || !currentGap || hasInitialized.current) return;
    if (repairMessages.length > 0) return;
    hasInitialized.current = true;
    clearRepairMessages();
    sendToAI(
      [{ role: 'user', content: `我准备好修复"${currentGap.issue}"这个问题了。请开始引导我。` }],
      'repair'
    );
  }, [resume, currentGap, repairMessages.length, clearRepairMessages, sendToAI]);

  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now(),
    };
    addRepairMessage(userMsg);
    const store = useStore.getState();
    const allMessages = [...store.repairMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
    sendToAI(allMessages, currentPhase === 'retest' ? 'retest' : 'repair');
  }, [addRepairMessage, sendToAI, currentPhase]);

  const handleStartRetest = () => {
    const systemMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'assistant',
      content: '---\n\n⚡ **进入压力测试**\n\n修复完成，但这还不够。真实面试中你会面对质疑、挑战和连续追问。\n\n现在我会用压力测试来验证你能否在挑战下 defend 自己的观点。\n\n准备好了吗？',
      timestamp: Date.now(),
    };
    addRepairMessage(systemMsg);
    setCurrentPhase('retest');
  };

  const handleRetestGo = () => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: '准备好了，请开始复测。', timestamp: Date.now(),
    };
    addRepairMessage(userMsg);
    const store = useStore.getState();
    const allMessages = [...store.repairMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
    sendToAI(allMessages, 'retest');
  };

  if (!config || !resume || !currentGap) return null;

  const phaseTitle = {
    repair: `修复：${currentGap.subCompetencyName || currentGap.issue}`,
    retest: '⚡ 压力测试',
    done: retestResult === 'pass' ? '✅ 通过压力测试！' : '未通过压力测试',
  }[currentPhase];

  return (
    <div className="h-screen flex flex-col">
      <StepIndicator current="repair" />
      {currentPhase === 'retest' && !repairMessages.some(m => m.content.includes('压力测试')) && (
        <div className="bg-purple-50 px-4 py-2 text-center">
          <p className="text-xs text-purple-700">⚡ 压力测试 — 需要在质疑和挑战下 defend 才能标记为 Ready</p>
        </div>
      )}

      <ChatInterface
        messages={repairMessages}
        onSend={handleSend}
        isLoading={isLoading}
        placeholder={currentPhase === 'done' ? '训练完成' : '输入你的回答...'}
        disabled={currentPhase === 'done'}
        title={phaseTitle}
        subtitle={`${currentGap.competencyName}`}
      />

      <div className="border-t border-gray-100 bg-white p-4">
        <div className="max-w-lg mx-auto">
          {currentPhase === 'repair' && repairMessages.length >= 4 && !isLoading && (
            <button onClick={handleStartRetest}
              className="w-full py-3 rounded-xl border-2 border-purple-400 text-purple-700 font-medium text-sm hover:bg-purple-50 transition-colors">
              ⚡ 进入压力测试
            </button>
          )}
          {currentPhase === 'retest' && repairMessages[repairMessages.length - 1]?.content.includes('准备好了吗') && !isLoading && (
            <button onClick={handleRetestGo}
              className="w-full py-3 rounded-xl bg-purple-700 text-white font-medium text-sm hover:bg-purple-800 transition-colors">
              ⚡ 开始压力测试 →
            </button>
          )}
          {currentPhase === 'done' && (
            <div className="space-y-2">
              <div className="text-center mb-3">
                {retestResult === 'pass' ? (
                  <p className="text-green-600 font-semibold">🟢 恭喜！这项已经 Ready</p>
                ) : (
                  <p className="text-red-600 font-semibold">🔴 还需要继续练习</p>
                )}
              </div>
              <button onClick={() => {
                clearRepairMessages();
                hasInitialized.current = false;
                setPhase('gaps');
                router.push('/gaps');
              }}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
                {gaps.filter(g => g.competencyId !== currentGap.competencyId).length > 0 ? '修复下一个缺口 →' : '查看今日总结 →'}
              </button>
              <button onClick={() => { setPhase('summary'); router.push('/summary'); }}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                结束今天的练习
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
