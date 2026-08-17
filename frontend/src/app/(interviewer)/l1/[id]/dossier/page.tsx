'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function L1CandidateDossierPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [dossier, setDossier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Evaluation State
  const [decision, setDecision] = useState<'PASS' | 'REJECT'>('PASS');
  const [rating, setRating] = useState(4.0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const token = localStorage.getItem('autergo_token');
        const res = await fetch(`${API_BASE_URL}/interviews/l1/${applicationId}/dossier`, {
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

    fetchDossier();
  }, [applicationId]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`${API_BASE_URL}/interviews/l1/${applicationId}/evaluate`, {
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
        alert(`Evaluation Submitted! Candidate marked as ${decision === 'PASS' ? 'L2 Eligible' : 'L1 Rejected'}.`);
        router.push('/l1');
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
          <Link href="/l1" className="text-sm text-slate-400 hover:text-white">
            &larr; Back to L1 Pool
          </Link>
          <span className="text-xs font-mono text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full font-bold">
            L1 Technical Review Dossier
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
              <div className="text-xs text-slate-400">Referral Source</div>
              <div className="text-sm font-bold text-slate-300">{dossier.candidate.referral_source}</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-xs text-emerald-400">Test Score</div>
              <div className="text-sm font-bold text-emerald-400">{dossier.test_results.percentage.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Device</div>
              <div className="text-sm font-bold capitalize text-slate-300">{dossier.test_results.device_type}</div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Submitted Test Paper & Evaluation Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Test Paper & Candidate Answers */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Submitted Assessment Paper</h2>
              <span className="text-xs font-mono text-slate-400">
                {dossier.test_results.questions_graded.length} Questions Graded
              </span>
            </div>

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

                  {/* Submitted vs Correct */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Candidate Submitted Answer:</span>
                      <span className={q.is_correct ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                        {q.submitted_answer !== undefined && q.submitted_answer !== null ? String(q.submitted_answer) : '(No answer submitted)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Correct Answer Key:</span>
                      <span className="text-slate-300">{String(q.correct_answer)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: L1 Evaluation Form */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-lg font-bold text-white">Submit L1 Technical Evaluation</h2>

            <form onSubmit={handleEvaluate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Technical Verdict</label>
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
                    ✓ PASS (Advance to L2)
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
                    ✗ REJECT (Mark L1 Rejected)
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Detailed Feedback Notes & Rejection Reason (if rejected) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Candidate demonstrated strong knowledge in data structures but needs work on system design..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xl transition-all text-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit L1 Evaluation'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
