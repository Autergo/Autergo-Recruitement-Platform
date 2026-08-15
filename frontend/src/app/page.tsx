'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if recruiter is logged in
    const token = localStorage.getItem('autergo_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
          <span className="text-xl font-extrabold tracking-wider text-white">AUTERGO</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all"
          >
            Recruiter Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-full mb-6">
          <span>✨ AI-Powered Enterprise Recruitment Operating System</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight mb-6">
          Scalable, Durable & <span className="text-emerald-400">Zero-Friction</span> Technical Assessments
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Autergo delivers end-to-end recruitment drives: 8-step campaign wizard, multi-signal AI edge proctoring, sandboxed coding execution, live recruiter command centers, and Candidate 360 scorecards.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-950 transition-all text-base"
          >
            Access Recruiter Portal
          </Link>
          <Link
            href="/test/demo-invite-token-12345/verify"
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-base"
          >
            Try Candidate Assessment Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-20 w-full">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold mb-4">
              🎯
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Recruitment Drives</h3>
            <p className="text-sm text-slate-400">
              Configure job descriptions, eligibility criteria, custom candidate fields, and multi-round stages.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Signal Proctoring</h3>
            <p className="text-sm text-slate-400">
              Edge CV face tracking, phone anomaly detection, and weighted risk scoring with human reviewer adjudication.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Command Center</h3>
            <p className="text-sm text-slate-400">
              Sub-5s WebSocket operational dashboard with candidate counters, progress tracking, and anomaly alerts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        Autergo Enterprise Recruitment Platform &bull; Built with FastAPI, Next.js 14, and Multi-Tier LLM Architecture.
      </footer>
    </div>
  );
}
