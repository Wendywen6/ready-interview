/**
 * POST /api/evaluate
 * 评估诊断对话，提取证据并识别缺口
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/ai';
import { buildEvaluatePrompt } from '@/lib/prompts';
import type { EvaluateRequest, EvaluateResponse } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: EvaluateRequest = await req.json();
    const { conversation, competencies, resume } = body;

    if (!conversation?.length || !competencies?.length) {
      return NextResponse.json(
        { error: '缺少对话记录或能力点数据' },
        { status: 400 }
      );
    }

    // 将 ChatMessage[] 转换为对话格式
    const convoForPrompt = conversation.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const prompt = buildEvaluatePrompt(convoForPrompt, competencies, resume);

    const result = await chatJSON<EvaluateResponse>(
      [
        { role: 'system', content: '你是面试评估专家。请严格按照要求输出JSON格式。只输出JSON，不要任何其他文字。' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.2, maxTokens: 4096 }
    );

    // 确保返回数据的完整性
    const response: EvaluateResponse = {
      competencyUpdates: (result.competencyUpdates || []).map((u) => ({
        competencyId: u.competencyId,
        status: u.status || 'unknown',
        evidence: (u.evidence || []).map((e) => ({
          ability: e.ability,
          observed: e.observed,
          detail: e.detail || '',
        })),
      })),
      topGaps: (result.topGaps || []).map((g) => ({
        competencyId: g.competencyId,
        competencyName: g.competencyName,
        severity: g.severity || 'important',
        issue: g.issue,
        userQuote: g.userQuote || '',
        whyDangerous: g.whyDangerous,
        repairMinutes: g.repairMinutes || 8,
      })),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[/api/evaluate] Error:', error);
    const message = error instanceof Error ? error.message : '评估失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
