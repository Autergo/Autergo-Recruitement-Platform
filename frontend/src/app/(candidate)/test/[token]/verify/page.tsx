'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CandidateVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [driveInfo, setDriveInfo] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch(`${API_BASE_URL}/public/invitations/${token}`);
        if (res.ok) {
          setDriveInfo(await res.json());
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.detail || 'Invalid invitation link.');
        }
      } catch (err: any) {
        setError('Invalid invitation link.');
      }
    }
    if (token) checkToken();
  }, [token]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/public/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_token: token,
          email,
          otp,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('candidate_session_token', data.session_token);
        router.push(`/test/${token}/readiness`);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Verification failed.');
      }
    } catch (err: any) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Autergo Assessment</span>
          <h1 className="text-2xl font-bold text-white mt-1">
            {driveInfo?.drive_title || 'Candidate Verification'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{driveInfo?.job_title}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Your Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">One-Time Password (OTP)</label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-center tracking-widest text-lg"
            />
            <p className="text-xs text-slate-500 mt-1">Demo code: 123456</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue to System Check &rarr;'}
          </button>
        </form>
      </div>
    </div>
  );
}
