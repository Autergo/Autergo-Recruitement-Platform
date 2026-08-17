'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function L2CandidateDossierPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [dossier, setDossier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Evaluation State
  const [decision, setDecision] = useState<'PASS' | 'REJECT'>('PASS');
  const [rating, setRating] = useState(4.5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDossier();
  }, [applicationId]);

  const fetchDossier = async () => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`http://localhost:8000/api/v1/interviews/l2/${applicationId}/dossier`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDossier(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`http://localhost:8000/api/v1/interviews/l2/${applicationId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          decision,
          rating,
          feedback,
        }),
      });

      if (res.ok) {
        alert(`Evaluation Submitted! Candidate marked as ${decision === 'PASS' ? 'Selected / Final Cleared' : 'L2 Rejected'}.`);
        router.push('/l2');
      } else {
        alert('Failed to submit evaluation.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading candidate dossier...</div>;
  }

  if (!dossier) {
    return <div className="min-h-screen bg-slate-950 text-rose-400 flex items-center justify-center">Dossier not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex justify-between items-center">
          <Link href="/l2" className="text-sm text-slate-400 hover:text-white">
            &larr; Back to L2 Pool
          </Link>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/80 border border-purple-800 px-3 py-1 rounded-full font-bold">
            L2 Advanced / Panel Review Dossier
          </span>
        </div>

        {/* Candidate Profile Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap justify-between items-center gap-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{dossier.candidate.name}</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{dossier.candidate.email} • {dossier.candidate.phone}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Experience</div>
              <div className="text-sm font-bold text-white">{dossier.candidate.experience_years} Years</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-xs text-emerald-400">Test Score</div>
              <div className="text-sm font-bold text-emerald-400">{dossier.test_results.percentage.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-xs text-amber-400">L1 Rating</div>
              <div className="text-sm font-bold text-amber-400">★ {dossier.l1_evaluation?.rating || '4.0'} / 5.0</div>
            </div>
          </div>
        </div>

        {/* L1 Interviewer Notes Highlight Box */}
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              📝 Notes from L1 Interviewer ({dossier.l1_evaluation?.interviewer_name || 'L1 Reviewer'})
            </span>
            <span className="text-xs font-mono text-amber-300">
              Verdict: {dossier.l1_evaluation?.decision || 'PASS'}
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
            "{dossier.l1_evaluation?.feedback || 'Candidate solved technical algorithmic questions quickly and explained reasoning cleanly.'}"
          </p>
        </div>

        {/* 2-Column Grid: Submitted Test Paper & Evaluation Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Test Paper & Candidate Answers */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-lg font-bold text-white">Original Assessment Submission</h2>

            <div className="space-y-4">
              {dossier.test_results.questions_graded.map((q: any, i: number) => (
                <div key={q.id || i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Question {i + 1} ({q.question_type.toUpperCase()})</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${q.is_correct ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {q.is_correct ? '✓ Correct' : '✗ Incorrect'} ({q.marks_awarded}/{q.marks} Marks)
                    </span>
                  </div>

                  <p className="text-sm font-medium text-white">{q.title}</p>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Candidate Submitted Answer:</span>
                      <span className={q.is_correct ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                        {q.submitted_answer !== undefined && q.submitted_answer !== null ? String(q.submitted_answer) : '(No answer submitted)'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: L2 Evaluation Form */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-lg font-bold text-white">Submit L2 Panel Decision</h2>

            <form onSubmit={handleEvaluate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Final Hiring Recommendation</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('PASS')}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                      decision === 'PASS'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✓ PASS & SELECT
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                      decision === 'REJECT'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✗ REJECT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Overall Rating (1.0 to 5.0)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  L2 Panel Comments & Notes *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Candidate excels in high-level distributed systems architecture and system reliability..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xl transition-all text-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit L2 Panel Decision'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
