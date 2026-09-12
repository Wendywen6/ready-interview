import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ready — 保研面试准备度分诊",
  description: "帮你找出真正还没准备好的部分，而不是让你练更多题。",
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
