import React from 'react';

export default function Candidate360Page() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-xs uppercase font-bold text-emerald-400">Candidate 360 Evaluation</span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Priya Sharma</h1>
          <p className="text-slate-400 text-sm">Applied for AI Software Engineer Campus Drive 2026</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg text-sm font-medium border border-rose-800">
            Reject
          </button>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium">
            Hold
          </button>
          <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg">
            ✓ Strong Hire / Select
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <span className="text-xs text-slate-400 uppercase font-semibold">Technical Score</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">92%</p>
          <p className="text-xs text-slate-400 mt-1">MCQ: 90% | Coding: 100% (2/2 test cases passed)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <span className="text-xs text-slate-400 uppercase font-semibold">Proctoring Risk Level</span>
          <p className="text-3xl font-extrabold text-blue-400 mt-2">NORMAL (14/100)</p>
          <p className="text-xs text-slate-400 mt-1">0 Critical Flags • 1 Minor Tab Blur</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <span className="text-xs text-slate-400 uppercase font-semibold">Role Match Alignment</span>
          <p className="text-3xl font-extrabold text-purple-400 mt-2">95%</p>
          <p className="text-xs text-slate-400 mt-1">Python, SQL, DSA & System Design Verified</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* AI Competency Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Grounded AI Summary & Competency Breakdown</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Candidate demonstrated exceptional proficiency in Python core structures and algorithmic problem solving. Reversal algorithms and generator memory models were answered cleanly.
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Python & Data Structures</span>
                <span className="text-emerald-400 font-bold">96%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '96%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>SQL & Window Functions</span>
                <span className="text-emerald-400 font-bold">88%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Interviewer Notes & Rubric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Structured Interview Feedback</h2>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-200">Technical Deep Dive — Round 1</span>
                <span className="text-xs text-emerald-400 font-bold">Rating: 5 / 5</span>
              </div>
              <p className="text-xs text-slate-400">
                &ldquo;Strong grasp of concurrency models. Solved multi-pointer problems in under 10 minutes.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
