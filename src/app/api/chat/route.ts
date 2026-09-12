/**
 * POST /api/chat
 * 统一的流式对话接口，支持 diagnostic / repair / retest 三种模式
 */

import { NextRequest } from 'next/server';
import { chatStream } from '@/lib/ai';
import {
  buildDiagnosticSystemPrompt,
  buildRepairSystemPrompt,
  buildRetestSystemPrompt,
} from '@/lib/prompts';
import type { ChatRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, mode, context } = body;

    // 根据模式构建系统提示词
    let systemPrompt = '';

    switch (mode) {
      case 'diagnostic':
        if (!context.resume || !context.competencies) {
          return new Response('缺少简历或能力点数据', { status: 400 });
        }
        systemPrompt = buildDiagnosticSystemPrompt(
          context.resume,
          context.competencies
        );
        break;

      case 'repair':
        if (!context.resume || !context.gapInfo) {
          return new Response('缺少简历或缺口信息', { status: 400 });
        }
        systemPrompt = buildRepairSystemPrompt(context.gapInfo, context.resume);
        break;

      case 'retest':
        if (!context.resume || !context.gapInfo) {
          return new Response('缺少简历或缺口信息', { status: 400 });
        }
        systemPrompt = buildRetestSystemPrompt(context.gapInfo, context.resume);
        break;

      default:
        return new Response('未知模式', { status: 400 });
    }

    // 构建完整的消息列表
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // 获取流式响应
    const stream = await chatStream(fullMessages);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    console.error('[/api/chat] Error:', error);
    const message = error instanceof Error ? error.message : '对话失败';
    return new Response(message, { status: 500 });
  }
}
