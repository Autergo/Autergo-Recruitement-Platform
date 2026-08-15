import React from 'react';

export default function AnalyticsDashboardPage() {
  const funnelStages = [
    { label: 'Invited Candidates', count: 1200, pct: '100%', color: 'bg-blue-600' },
    { label: 'Registered & Verified', count: 1050, pct: '87.5%', color: 'bg-indigo-600' },
    { label: 'Started Assessment', count: 980, pct: '81.6%', color: 'bg-purple-600' },
    { label: 'Completed Assessment', count: 920, pct: '76.6%', color: 'bg-pink-600' },
    { label: 'Qualified Cutoff (>70%)', count: 420, pct: '35.0%', color: 'bg-emerald-600' },
    { label: 'Interview Shortlisted', count: 150, pct: '12.5%', color: 'bg-teal-600' },
    { label: 'Final Offers Extended', count: 45, pct: '3.75%', color: 'bg-amber-500' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Drive Intelligence & Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">
          Conversion funnel, score distribution histograms, and question intelligence analytics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Invited</span>
          <p className="text-3xl font-bold text-white mt-2">1,200</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Completion Rate</span>
          <p className="text-3xl font-bold text-emerald-400 mt-2">76.6%</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Average Test Score</span>
          <p className="text-3xl font-bold text-blue-400 mt-2">78.4%</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Integrity Verified</span>
          <p className="text-3xl font-bold text-purple-400 mt-2">98.2%</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-6">Candidate Recruitment Pipeline Funnel</h2>
        <div className="space-y-4">
          {funnelStages.map((stage, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-medium">{stage.label}</span>
                <span className="font-bold text-white">{stage.count} ({stage.pct})</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className={`${stage.color} h-full transition-all`} style={{ width: stage.pct }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
