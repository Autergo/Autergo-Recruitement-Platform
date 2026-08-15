import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autergo — Enterprise Recruitment & Assessment Platform',
  description: 'AI-Powered enterprise recruitment operating system for candidate management, assessments, multi-signal proctoring, and live command centers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
