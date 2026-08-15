import React, { useState } from 'react';

export default function InterviewsPage() {
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [ratings, setRatings] = useState({
    technical_knowledge: 5,
    problem_solving: 4,
    communication: 4,
    system_design: 5,
  });
  const [recommendation, setRecommendation] = useState('strong_hire');
  const [notes, setNotes] = useState('');

  const interviews = [
    {
      id: 'int-1',
      candidate_name: 'Priya Sharma',
      role: 'AI Software Engineer',
      round: 'Technical Deep Dive',
      mode: 'Coding & System Design',
      time: 'Today, 2:00 PM - 3:00 PM',
      status: 'scheduled',
      ai_suggested_focus: ['SQL Performance & Indexing', 'Concurrency in Python Generators'],
    },
    {
      id: 'int-2',
      candidate_name: 'Rahul Verma',
      role: 'Senior Backend Engineer',
      round: 'System Architecture',
      mode: 'Panel Interview',
      time: 'Tomorrow, 11:00 AM - 12:00 PM',
      status: 'scheduled',
      ai_suggested_focus: ['Distributed Transactions', 'Kafka Dead Letter Queues'],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Interview Engine & Rubrics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Conduct multi-round technical evaluations with AI question assistance and structured rubrics.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium shadow-md">
          + Schedule New Round
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 mb-6">
        <button
          onClick={() => setSelectedTab('upcoming')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            selectedTab === 'upcoming'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Scheduled Interviews (2)
        </button>
        <button
          onClick={() => setSelectedTab('completed')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            selectedTab === 'completed'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed Evaluations (14)
        </button>
      </div>

      {/* Interview List */}
      <div className="space-y-4">
        {interviews.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {item.round}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.time}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{item.candidate_name}</h3>
              <p className="text-xs text-slate-400">{item.role} • {item.mode}</p>

              {/* AI Suggested Focus */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-purple-400 font-semibold">✨ AI Suggested Focus:</span>
                {item.ai_suggested_focus.map((focus, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg">
                Join Meeting
              </button>
              <button
                onClick={() => setShowEvaluationModal(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-md"
              >
                Submit Rubric Evaluation
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Evaluation Rubric Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Structured Rubric Evaluation</h2>
            <p className="text-sm text-slate-400 mb-6">Candidate: Priya Sharma — AI Software Engineer</p>

            <div className="space-y-4 mb-6">
              {[
                { key: 'technical_knowledge', label: 'Technical Depth & Core Foundations' },
                { key: 'problem_solving', label: 'Problem Solving & Algorithmic Efficiency' },
                { key: 'communication', label: 'Articulating Trade-offs & Clarity' },
                { key: 'system_design', label: 'Scalability & Architectural Intuition' },
              ].map((criteria) => (
                <div key={criteria.key} className="flex justify-between items-center p-3 bg-slate-800/60 rounded-lg">
                  <span className="text-sm text-slate-200 font-medium">{criteria.label}</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setRatings({ ...ratings, [criteria.key]: score })}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          ratings[criteria.key as keyof typeof ratings] === score
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Interviewer Evidence Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Candidate articulated memory boundaries cleanly and solved two-pointer optimization in O(N)..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Final Recommendation</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'strong_hire', label: 'Strong Hire', color: 'bg-emerald-600' },
                  { id: 'hire', label: 'Hire', color: 'bg-emerald-800' },
                  { id: 'hold', label: 'Hold', color: 'bg-amber-700' },
                  { id: 'reject', label: 'Reject', color: 'bg-rose-800' },
                ].map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setRecommendation(rec.id)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      recommendation === rec.id
                        ? `${rec.color} text-white ring-2 ring-white/50`
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Evaluation recorded and Candidate 360 updated successfully!');
                  setShowEvaluationModal(false);
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-lg"
              >
                ✓ Submit Final Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
