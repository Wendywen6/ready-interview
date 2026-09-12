/**
 * POST /api/analyze
 * 接收简历文本 + 面试配置，返回解析后的简历数据和能力点地图
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/ai';
import { buildAnalyzePrompt } from '@/lib/prompts';
import type { AnalyzeRequest, AnalyzeResponse, Competency } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { resumeText, config } = body;

    if (!resumeText || !config) {
      return NextResponse.json(
        { error: '缺少简历内容或面试配置' },
        { status: 400 }
      );
    }

    const prompt = buildAnalyzePrompt(resumeText, config);

    const result = await chatJSON<AnalyzeResponse>(
      [
        { role: 'system', content: '你是面试准备分析专家。请严格按照要求输出JSON格式。' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 4096 }
    );

    // 确保每个 competency 都有完整的字段
    const competencies: Competency[] = (result.competencies || []).map((c, index) => ({
      id: c.id || `comp_${index}`,
      name: c.name || '未命名',
      category: c.category || 'foundation',
      status: 'unknown' as const,
      evidence: [],
      priority: c.priority || index + 1,
      estimatedMinutes: c.estimatedMinutes || 5,
      needsRetest: false,
      whyPriority: c.whyPriority || '',
    }));

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

    return NextResponse.json({ resume, competencies });
  } catch (error: unknown) {
    console.error('[/api/analyze] Error:', error);
    const message = error instanceof Error ? error.message : '分析失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
