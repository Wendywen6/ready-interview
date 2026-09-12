'use client';

/**
 * 首页 / Setup 页面
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function SetupPage() {
  const router = useRouter();
  const { setConfig, setResume, setCompetencies, setPhase, setDiagnosticPlan } = useStore();

  const [targetSchool, setTargetSchool] = useState('');
  const [targetDirection, setTargetDirection] = useState('');
  const [daysUntil, setDaysUntil] = useState('3');
  const [availableTime, setAvailableTime] = useState('60');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingTimer = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState('');

  const loadingTexts = [
    '正在阅读你的简历...',
    '正在分析科研与项目经历...',
    '正在生成个性化检查项...',
    '正在规划诊断计划...',
  ];

  useEffect(() => {
    if (isLoading) {
      setLoadingStage(0);
      loadingTimer.current = setInterval(() => {
        setLoadingStage(prev => Math.min(prev + 1, loadingTexts.length - 1));
      }, 3000);
    } else {
      if (loadingTimer.current) clearInterval(loadingTimer.current);
    }
    return () => { if (loadingTimer.current) clearInterval(loadingTimer.current); };
  }, [isLoading, loadingTexts.length]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    if (file.type === 'application/pdf') {
      try {
        const { extractTextFromPDF } = await import('@/lib/pdf-client');
        const text = await extractTextFromPDF(file);
        if (text.trim()) {
          setResumeText(text);
        } else {
          setError('PDF 内容为空，请直接粘贴简历文字内容');
        }
      } catch (err) {
        console.error('PDF parse error:', err);
        setError('PDF解析失败，请直接粘贴简历文字内容到下方文本框');
      }
    } else {
      const text = await file.text();
      setResumeText(text);
    }
  }, []);

  const handleSubmit = async () => {
    if (!resumeText.trim()) {
      setError('请上传简历或粘贴简历内容');
      return;
    }

    setIsLoading(true);
    setError('');

    const config = {
      targetSchool: targetSchool || '未指定',
      targetDirection: targetDirection || 'CS/AI',
      daysUntilInterview: parseInt(daysUntil) || 3,
      availableMinutes: parseInt(availableTime) || 60,
      additionalInfo,
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, config }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '分析失败');
      }

      const data = await res.json();
      setConfig(config);
      setResume(data.resume, resumeText);
      setCompetencies(data.competencies);
      if (data.diagnosticPlan) setDiagnosticPlan(data.diagnosticPlan);
      setPhase('map');
      router.push('/map');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '分析失败，请重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-shrink-0 pt-16 pb-8 px-4 text-center">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ready</h1>
          <p className="mt-2 text-sm text-gray-400 font-medium">科研面试防御系统</p>
        </div>
        <div className="mt-6 max-w-md mx-auto animate-slide-up">
          <p className="text-base text-gray-700 leading-relaxed">
            不是帮你多练题，而是找出你的<span className="text-gray-900 font-semibold">简历攻击面</span>、
          </p>
          <p className="text-base text-gray-700 leading-relaxed">
            验证<span className="text-gray-900 font-semibold">项目归属真实性</span>、模拟<span className="text-gray-900 font-semibold">连续追问压力</span>。
          </p>
        </div>
        {/* 三个核心模块 */}
        <div className="mt-6 max-w-sm mx-auto grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <span className="text-lg">🎯</span>
            <p className="text-[10px] font-semibold text-red-700 mt-1">Attack Surface</p>
            <p className="text-[10px] text-red-500 mt-0.5">简历哪里最易被攻击</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <span className="text-lg">🔍</span>
            <p className="text-[10px] font-semibold text-amber-700 mt-1">Ownership Audit</p>
            <p className="text-[10px] text-amber-600 mt-0.5">项目真的是你做的吗</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <span className="text-lg">⚡</span>
            <p className="text-[10px] font-semibold text-purple-700 mt-1">Stress Test</p>
            <p className="text-[10px] text-purple-500 mt-0.5">连续追问你能扛住吗</p>
          </div>
        </div>
      </div>

      {/* 配置表单 */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-12">
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">你的面试</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">目标院校</label>
                <input type="text" value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)}
                  placeholder="如：北大信科"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">研究方向</label>
                <input type="text" value={targetDirection} onChange={(e) => setTargetDirection(e.target.value)}
                  placeholder="如：具身智能"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">距面试还有</label>
                <select value={daysUntil} onChange={(e) => setDaysUntil(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                  <option value="1">明天</option>
                  <option value="3">3天</option>
                  <option value="7">1周</option>
                  <option value="14">2周</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">今天能练</label>
                <select value={availableTime} onChange={(e) => setAvailableTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                  <option value="15">15 分钟</option>
                  <option value="30">30 分钟</option>
                  <option value="60">1 小时</option>
                  <option value="120">2 小时</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">补充信息（可选）</label>
              <input type="text" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="如：该学校要求英语面试、已知考查操作系统..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300" />
            </div>
          </div>

          {/* 简历 */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">你的简历</h2>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
              <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} className="hidden" />
              {fileName ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">📄 {fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">点击更换</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">点击上传简历</p>
                  <p className="text-xs text-gray-400 mt-1">支持 PDF / TXT / MD</p>
                </div>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-x-0 top-0 flex justify-center -mt-3">
                <span className="bg-white px-3 text-xs text-gray-300">或直接粘贴</span>
              </div>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                placeholder="粘贴你的简历内容..." rows={6}
                className="w-full px-3 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300 resize-none mt-2" />
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

          <button onClick={handleSubmit} disabled={isLoading || !resumeText.trim()}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loadingTexts[loadingStage]}
              </span>
            ) : '开始分诊'}
          </button>
          <p className="text-xs text-gray-300 text-center">我们不会存储你的简历数据</p>
        </div>
      </div>
    </div>
  );
}
