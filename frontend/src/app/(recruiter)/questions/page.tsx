import React from 'react';

export default function QuestionsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Bank & AI Generator</h1>
          <p className="text-slate-400 mt-1">Manage competency pools, generate multi-skill assessment items, and verify answer keys</p>
        </div>
        <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium shadow-md">
          ✨ Generate Questions with AI
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Filter by skill (e.g. Python, SQL, DSA)..."
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
          />
          <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
            <option value="">All Question Types</option>
            <option value="single_mcq">Single MCQ</option>
            <option value="coding">Coding Sandbox</option>
            <option value="sql">SQL Query</option>
          </select>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-lg flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  PYTHON
                </span>
                <span className="text-xs text-slate-400 font-mono">Medium • 1 Mark</span>
                <span className="text-xs text-blue-400">✨ AI-Generated</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                What is the primary advantage of using a generator expression over a list comprehension in Python?
              </p>
            </div>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200">
              Edit / Verify
            </button>
          </div>

          <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-lg flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-950 text-blue-400 border border-blue-800">
                  DSA / CODING
                </span>
                <span className="text-xs text-slate-400 font-mono">Easy • 5 Marks</span>
                <span className="text-xs text-emerald-400">✓ Verified</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                Write a function `solution(s)` in Python that reverses the input string in-place.
              </p>
            </div>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200">
              Edit / Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
