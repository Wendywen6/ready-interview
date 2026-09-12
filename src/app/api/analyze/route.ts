/**
 * POST /api/analyze
 * 解析简历 + 生成面试地图 + 10分钟诊断计划
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/ai';
import { buildAnalyzePrompt } from '@/lib/prompts';
import type { AnalyzeRequest, AnalyzeResponse, Competency, DiagnosticPlan } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { resumeText, config } = body;

    if (!resumeText || !config) {
      return NextResponse.json({ error: '缺少简历内容或面试配置' }, { status: 400 });
    }

    const prompt = buildAnalyzePrompt(resumeText, config);

    const result = await chatJSON<AnalyzeResponse>(
      [
        { role: 'system', content: '你是面试准备分析专家。请严格按照要求输出JSON格式。确保每个competency都包含subCompetencies数组。' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 6000 }
    );

    // 规范化 competencies
    const competencies: Competency[] = (result.competencies || []).map((c, index) => ({
      id: c.id || `comp_${index}`,
      name: c.name || '未命名',
      category: c.category || 'foundation',
      subCompetencies: (c.subCompetencies || []).map((s, si) => ({
        id: s.id || `${c.id}_sub_${si}`,
        name: s.name || '未命名',
        status: 'unknown' as const,
        evidence: [],
      })),
      priority: c.priority || index + 1,
      estimatedMinutes: c.estimatedMinutes || 5,
      needsRetest: false,
      whyCheck: c.whyCheck || '',
      source: c.source || 'general',
      sourceDetail: c.sourceDetail || '',
    }));

    // 规范化 diagnosticPlan
    const diagnosticPlan: DiagnosticPlan = {
      items: (result.diagnosticPlan?.items || []).map(item => ({
        competencyId: item.competencyId,
        competencyName: item.competencyName,
        focusSubIds: item.focusSubIds || [],
        estimatedMinutes: item.estimatedMinutes || 4,
        category: item.category || 'project',
        whyFirst: item.whyFirst || '',
      })),
      totalMinutes: result.diagnosticPlan?.totalMinutes || 10,
    };

    const resume = {
      name: result.resume?.name || '',
      school: result.resume?.school || '',
      major: result.resume?.major || '',
      gpa: result.resume?.gpa || '',
      projects: result.resume?.projects || [],
      skills: result.resume?.skills || [],
      awards: result.resume?.awards || [],
      rawText: resumeText,
    };

    return NextResponse.json({ resume, competencies, diagnosticPlan });
  } catch (error: unknown) {
    console.error('[/api/analyze] Error:', error);
    const message = error instanceof Error ? error.message : '分析失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
