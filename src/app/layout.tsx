import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ready — 保研面试深度体检",
  description: "扫描简历风险、验证项目归属、模拟压力追问，找出你真正需要准备的部分。",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
