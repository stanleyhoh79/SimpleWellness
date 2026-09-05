import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '极简养生｜让养生轻松简单',
  description: '从日常饮食、身体活动和夜间休息开始，找到适合自己的养生节奏。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
