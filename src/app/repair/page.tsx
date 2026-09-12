'use client';

/**
 * Gap Repair 页面
 * 训练模式 + 延迟复测
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ChatInterface } from '@/components/ChatInterface';
import type { ChatMessage } from '@/lib/types';

type RepairPhase = 'repair' | 'retest' | 'done';

export default function RepairPage() {
  const router = useRouter();
  const {
    config, resume, gaps, repairTargetGapId,
    repairMessages, addRepairMessage, updateLastRepairMessage, clearRepairMessages,
    updateCompetencyStatus, setPhase,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<RepairPhase>('repair');
  const hasInitialized = useRef(false);

  // 找到当前修复的缺口
  const currentGap = gaps.find(g => g.competencyId === repairTargetGapId) || gaps[0];

  useEffect(() => {
    if (!config || !resume || !currentGap) {
      router.push('/gaps');
    }
  }, [config, resume, currentGap, router]);

  // 发送消息到AI
  const sendToAI = useCallback(async (messages: { role: string; content: string }[], mode: 'repair' | 'retest') => {
    setIsLoading(true);

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    addRepairMessage(assistantMsg);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode,
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
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        updateLastRepairMessage(fullText);
      }

      // 检查修复完成或复测结果
      if (fullText.includes('[REPAIR_COMPLETE]')) {
        const cleanText = fullText.replace('[REPAIR_COMPLETE]', '').trim();
        updateLastRepairMessage(cleanText);
        // 标记为 pending，等待复测
        if (currentGap) {
          updateCompetencyStatus(currentGap.competencyId, 'pending');
        }
        setCurrentPhase('retest');
      } else if (fullText.includes('[RETEST_PASS]')) {
        const cleanText = fullText.replace('[RETEST_PASS]', '').trim();
        updateLastRepairMessage(cleanText);
        if (currentGap) {
          updateCompetencyStatus(currentGap.competencyId, 'ready');
        }
        setCurrentPhase('done');
      } else if (fullText.includes('[RETEST_FAIL]')) {
        const cleanText = fullText.replace('[RETEST_FAIL]', '').trim();
        updateLastRepairMessage(cleanText);
        if (currentGap) {
          updateCompetencyStatus(currentGap.competencyId, 'weak');
        }
        setCurrentPhase('done');
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateLastRepairMessage('抱歉，发生了错误。请刷新页面重试。');
    } finally {
      setIsLoading(false);
    }
  }, [resume, currentGap, addRepairMessage, updateLastRepairMessage, updateCompetencyStatus]);

  // 初始化：开始修复训练
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

  // 处理用户发送
  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addRepairMessage(userMsg);

    const store = useStore.getState();
    const allMessages = [...store.repairMessages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    const mode = currentPhase === 'retest' ? 'retest' : 'repair';
    sendToAI(allMessages, mode);
  }, [addRepairMessage, sendToAI, currentPhase]);

  // 开始复测
  const handleStartRetest = () => {
    // 添加一个系统提示
    const systemMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: '---\n\n🟡 **进入复测环节**\n\n你刚刚在提示下完成了回答，这还不能证明已经掌握。现在我会从一个不同的角度来验证。\n\n准备好了吗？',
      timestamp: Date.now(),
    };
    addRepairMessage(systemMsg);
    setCurrentPhase('retest');
  };

  // 处理复测开始
  const handleRetestGo = () => {
    const store = useStore.getState();
    const allMessages = store.repairMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    allMessages.push({ role: 'user', content: '准备好了，请开始复测。' });

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: '准备好了，请开始复测。',
      timestamp: Date.now(),
    };
    addRepairMessage(userMsg);

    sendToAI(allMessages, 'retest');
  };

  if (!config || !resume || !currentGap) return null;

  // 获取当前能力点状态
  const store = useStore.getState();
  const currentCompetency = store.competencies.find(c => c.id === currentGap.competencyId);

  const phaseTitle = {
    repair: `修复：${currentGap.issue}`,
    retest: '复测验证',
    done: currentCompetency?.status === 'ready' ? '✅ 通过复测！' : '需要继续训练',
  }[currentPhase];

  return (
    <div className="h-screen flex flex-col">
      {/* 状态提示条 */}
      {currentPhase === 'retest' && !repairMessages.some(m => m.content.includes('进入复测环节')) && (
        <div className="bg-yellow-50 px-4 py-2 text-center">
          <p className="text-xs text-yellow-700">
            🟡 已标记为"待复测" — 你需要通过一个不同角度的问题才能标记为 Ready
          </p>
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

      {/* 底部操作按钮 */}
      <div className="border-t border-gray-100 bg-white p-4">
        <div className="max-w-lg mx-auto">
          {currentPhase === 'repair' && repairMessages.length >= 4 && !isLoading && (
            <button
              onClick={handleStartRetest}
              className="w-full py-3 rounded-xl border-2 border-yellow-400 text-yellow-700 font-medium text-sm hover:bg-yellow-50 transition-colors"
            >
              🟡 进入复测环节
            </button>
          )}

          {currentPhase === 'retest' && repairMessages[repairMessages.length - 1]?.content.includes('准备好了吗') && !isLoading && (
            <button
              onClick={handleRetestGo}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              开始复测 →
            </button>
          )}

          {currentPhase === 'done' && (
            <div className="space-y-2">
              {currentCompetency?.status === 'ready' ? (
                <div className="text-center mb-3">
                  <p className="text-green-600 font-semibold">🟢 恭喜！这项已经 Ready</p>
                </div>
              ) : (
                <div className="text-center mb-3">
                  <p className="text-red-600 font-semibold">🔴 还需要继续练习</p>
                </div>
              )}
              <button
                onClick={() => {
                  clearRepairMessages();
                  hasInitialized.current = false;
                  setPhase('gaps');
                  router.push('/gaps');
                }}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                {gaps.filter(g => g.competencyId !== currentGap.competencyId).length > 0
                  ? '修复下一个缺口 →'
                  : '查看今日总结 →'}
              </button>
              <button
                onClick={() => {
                  setPhase('summary');
                  router.push('/summary');
                }}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                结束今天的练习
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
