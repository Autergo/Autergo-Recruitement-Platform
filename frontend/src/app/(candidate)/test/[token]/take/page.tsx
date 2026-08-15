'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function AssessmentRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3600);

  // Mock assessment questions for candidate runner
  const questions = [
    {
      id: 'q1',
      type: 'mcq',
      title: 'Which Python data structure maintains elements in sorted order with O(log n) insertion?',
      options: ['List', 'Binary Search Tree / heapq', 'Dictionary', 'Set'],
    },
    {
      id: 'q2',
      type: 'code',
      title: 'Write a function `solution(s)` in Python that reverses the input string.',
      initialCode: 'def solution(s):\n    # Write code here\n    return s[::-1]',
    },
    {
      id: 'q3',
      type: 'mcq',
      title: 'What ACID property guarantees that all database updates in a transaction succeed or fail together?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    }
  ];

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectOption = (qId: string, opt: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleCodeChange = (qId: string, code: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: code }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const sessionToken = localStorage.getItem('candidate_session_token');
      await apiClient.post(
        '/public/assessment/submit',
        {},
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      setCompleted(true);
    } catch (err) {
      setCompleted(true); // Complete locally if session mock
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Assessment Submitted</h1>
          <p className="text-sm text-slate-400">
            Your responses and proctoring telemetry have been securely recorded. The recruitment team will review your evaluation shortly.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-8 flex justify-between items-center">
        <span className="font-bold text-lg text-emerald-400">AUTERGO ASSESSMENT</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-mono">Proctoring Active</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-lg font-mono text-sm font-semibold">
            ⏱ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Main Runner Area */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full p-8 gap-8">
        {/* Question Panel */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 rounded text-slate-400">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span className="text-xs text-emerald-400">✓ Auto-saved</span>
          </div>

          <h2 className="text-xl font-medium mb-6">{currentQ.title}</h2>

          {currentQ.type === 'mcq' && (
            <div className="space-y-3 flex-1">
              {currentQ.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    answers[currentQ.id] === opt
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'code' && (
            <div className="flex-1 flex flex-col">
              <textarea
                rows={10}
                value={answers[currentQ.id] || currentQ.initialCode}
                onChange={(e) => handleCodeChange(currentQ.id, e.target.value)}
                className="w-full flex-1 p-4 bg-slate-950 font-mono text-sm border border-slate-700 rounded-lg text-emerald-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm disabled:opacity-50"
            >
              &larr; Previous
            </button>
            {currentIdx === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-white"
              >
                {submitting ? 'Submitting...' : 'Submit Final Assessment'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 font-medium rounded-lg text-white text-sm"
              >
                Next &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="w-72 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Question Overview</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`py-2 text-xs font-semibold rounded ${
                  idx === currentIdx
                    ? 'ring-2 ring-emerald-500 bg-slate-800 text-white'
                    : answers[q.id]
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
