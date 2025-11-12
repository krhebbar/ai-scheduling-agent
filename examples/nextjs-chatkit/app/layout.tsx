import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Scheduling Agent - OpenAI Agents SDK Demo',
  description: 'Interactive demo of AI Scheduling Agent powered by OpenAI Agents SDK',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
