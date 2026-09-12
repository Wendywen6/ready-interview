'use client';

/**
 * 客户端 PDF 文本提取
 * 使用 pdfjs-dist 在浏览器端直接解析 PDF，避免服务端兼容问题
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  // 动态导入 pdfjs-dist（只在客户端加载）
  const pdfjsLib = await import('pdfjs-dist');

  // 设置 worker 为内联模式（避免加载外部 worker 文件）
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const arrayBuffer = await file.arrayBuffer();

  // 使用禁用 worker 的方式加载（更兼容）
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        if ('str' in item) return item.str;
        return '';
      })
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n').trim();
}
