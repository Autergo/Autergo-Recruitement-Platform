'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<'credentials' | 'interviewer'>('credentials');

  // Credentials Mode (Admin & Recruiter)
  const [email, setEmail] = useState('recruiter@autergo.com');
  const [password, setPassword] = useState('Recruiter@123');

  // Interviewer Name Mode (L1 & L2)
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerRole, setInterviewerRole] = useState<'l1_interviewer' | 'l2_interviewer'>('l1_interviewer');
  const [interviewersList, setInterviewersList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/interviewers`)
      .then((res) => res.json())
      .then((data) => setInterviewersList(data || []))
      .catch(console.error);
  }, []);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('autergo_token', data.access_token);
        localStorage.setItem('autergo_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError('Invalid email or password credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to reach authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewerName.trim()) {
      setError('Please select or enter your name.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/interviewer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: interviewerName.trim(), role: interviewerRole }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('autergo_token', data.access_token);
        localStorage.setItem('autergo_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError('Could not complete interviewer quick login.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center">
          <span className="text-xl font-extrabold tracking-widest text-emerald-400">AUTERGO</span>
          <h1 className="text-xl font-bold text-white mt-2">Enterprise Access Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access the recruitment operations workspace and candidate pools.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMode('credentials');
              setError('');
            }}
            className={`py-2.5 rounded-lg transition-all ${
              loginMode === 'credentials'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin & Recruiter
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('interviewer');
              setError('');
            }}
            className={`py-2.5 rounded-lg transition-all ${
              loginMode === 'interviewer'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interviewer Fast Login
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 1. Admin & Recruiter Login Form */}
        {loginMode === 'credentials' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
              <div>Demo Recruiter: <code className="text-emerald-400">recruiter@autergo.com</code> / <code className="text-emerald-400">Recruiter@123</code></div>
              <div>Demo Admin: <code className="text-emerald-400">admin@autergo.com</code> / <code className="text-emerald-400">Admin@123</code></div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace &rarr;'}
            </button>
          </form>
        )}

        {/* 2. Interviewer Quick Name Login Form */}
        {loginMode === 'interviewer' && (
          <form onSubmit={handleInterviewerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Interview Round Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInterviewerRole('l1_interviewer')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    interviewerRole === 'l1_interviewer'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  L1 Technical Pool
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewerRole('l2_interviewer')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    interviewerRole === 'l2_interviewer'
                      ? 'bg-purple-950 border-purple-500 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  L2 Panel Pool
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Select or Enter Your Name</label>
              <input
                type="text"
                list="interviewers"
                required
                placeholder="e.g. David Chen or Dr. Elena Rostova"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <datalist id="interviewers">
                {interviewersList.map((int) => (
                  <option key={int.id} value={int.full_name} />
                ))}
              </datalist>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              ⚡ No password required for interviewers. Select your name or type your name to jump directly to candidate review pools.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs disabled:opacity-50"
            >
              {loading ? 'Entering Pool...' : 'Quick Access Candidate Pool &rarr;'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
