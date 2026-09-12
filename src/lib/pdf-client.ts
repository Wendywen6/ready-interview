'use client';

/**
 * 客户端 PDF 文本提取
 * 使用 pdfjs-dist 在浏览器端直接解析 PDF
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // 使用 CDN 加载 worker（最可靠的方式）
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
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
