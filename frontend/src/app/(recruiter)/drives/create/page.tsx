'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateDrivePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [cutoff, setCutoff] = useState(60);
  const [duration, setDuration] = useState(45);
  const [sendRejections, setSendRejections] = useState(false);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<any[]>([
    {
      id: 'q-1',
      title: 'What is the average time complexity of searching in a hash table?',
      question_type: 'single_mcq',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      correct_answer: 'O(1)',
      marks: 5,
    },
    {
      id: 'q-2',
      title: 'Write a Python function `solution(s)` that reverses string `s`.',
      question_type: 'coding',
      options: [],
      boilerplate: 'def solution(s):\n    pass',
      correct_answer: 'return s[::-1]',
      marks: 10,
    },
  ]);

  const handleAddMCQ = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        title: 'New Multiple Choice Question',
        question_type: 'single_mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        marks: 5,
      },
    ]);
  };

  const handleAddCoding = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        title: 'Write an algorithm to solve the problem.',
        question_type: 'coding',
        options: [],
        boilerplate: 'def solution(nums):\n    pass',
        correct_answer: 'return sorted(nums)',
        marks: 10,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`${API_BASE_URL}/drives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          job_title: jobTitle,
          job_description: jobDescription,
          cutoff_percentage: cutoff,
          duration_minutes: duration,
          send_rejection_emails: sendRejections,
          onboarding_fields: ['experience_years', 'referral_source', 'phone'],
          questions,
        }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to create drive. Check your backend status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating drive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
            &larr; Back to Dashboard
          </Link>
          <span className="text-xs font-mono text-emerald-400">Recruiter Drive Builder</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Create & Publish Recruitment Drive</h1>
        <p className="text-sm text-slate-400 mb-8">
          Configure job basics, assessment question paper with answer keys, and L1 qualification cutoff %.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Drive Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white mb-4">1. Campaign Details</h2>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Drive Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Engineer 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Job Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  L1 Cutoff Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cutoff}
                  onChange={(e) => setCutoff(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Job Description</label>
              <textarea
                rows={3}
                required
                placeholder="Key requirements and candidate expectations..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="rejections"
                checked={sendRejections}
                onChange={(e) => setSendRejections(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="rejections" className="text-xs text-slate-300">
                Automatically send email notifications to rejected candidates upon stage failure
              </label>
            </div>
          </div>

          {/* 2. Question Paper Assembly */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-white">2. Assessment Question Paper & Answer Keys</h2>
                <p className="text-xs text-slate-400">Define test questions with scoring marks and correct answers.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddMCQ}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg border border-slate-700"
                >
                  + Add MCQ
                </button>
                <button
                  type="button"
                  onClick={handleAddCoding}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg border border-slate-700"
                >
                  + Add Coding
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Q{idx + 1} ({q.question_type.toUpperCase()})
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Marks: {q.marks}</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400">Question Statement</label>
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].title = e.target.value;
                        setQuestions(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    />
                  </div>

                  {q.question_type === 'single_mcq' ? (
                    <div>
                      <label className="text-xs font-medium text-slate-400">Correct Answer (Option Key)</label>
                      <input
                        type="text"
                        value={q.correct_answer}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].correct_answer = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-sm text-emerald-400 font-mono focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium text-slate-400">Expected Solution Pattern / Code</label>
                      <textarea
                        rows={2}
                        value={q.correct_answer}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].correct_answer = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-sm text-emerald-400 font-mono focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'Publishing Drive...' : '🚀 Publish Drive & Generate Magic Link / QR Code'}
          </button>
        </form>
      </div>
    </div>
  );
}

