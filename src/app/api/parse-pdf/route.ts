/**
 * POST /api/parse-pdf
 * 接收 PDF 文件，返回提取的文本内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

interface PDFPage {
  text: string;
  num: number;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未收到文件' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const parser = new PDFParse(uint8);
    const result = await parser.getText() as { pages: PDFPage[] };

    const text = result.pages
      .map((page: PDFPage) => page.text)
      .join('\n\n');

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error('[/api/parse-pdf] Error:', error);
    const message = error instanceof Error ? error.message : 'PDF解析失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
