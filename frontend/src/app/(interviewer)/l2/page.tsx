'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function L2InterviewerPoolPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchL2Pool();
  }, []);

  const fetchL2Pool = async () => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`${API_BASE_URL}/interviews/l2/pool`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`${API_BASE_URL}/interviews/l2/${applicationId}/claim`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        router.push(`/l2/${applicationId}/dossier`);
      } else {
        alert('Could not claim candidate.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRelease = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`${API_BASE_URL}/interviews/l2/${applicationId}/release`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        fetchL2Pool();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-extrabold tracking-wider text-emerald-400">
            AUTERGO
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-all">
              Recruiter Drives
            </Link>
            <Link href="/l1" className="text-slate-400 hover:text-white transition-all">
              L1 Interview Pool
            </Link>
            <Link href="/l2" className="text-white border-b-2 border-purple-500 pb-1 font-bold">
              L2 Interview Pool
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">L2 Advanced / Panel Interview Pool</h1>
            <p className="text-sm text-slate-400">
              Candidates who successfully cleared the L1 technical round. Claim a candidate to inspect complete history (including L1 interviewer notes & ratings) and submit final technical decision.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading L2 candidate pool...</div>
        ) : candidates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-2">No candidates currently in L2 pool.</p>
            <p className="text-xs text-slate-500">Candidates will appear here automatically when L1 interviewers pass them.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Test Score</th>
                  <th className="px-6 py-4">L1 Interviewer</th>
                  <th className="px-6 py-4">L1 Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {candidates.map((c) => (
                  <tr key={c.application_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{c.candidate_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">{c.drive_title}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                      {c.test_percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-xs text-amber-300 font-medium">
                      {c.l1_interviewer_name || 'L1 Reviewer'}
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-400">
                      ★ {c.l1_rating || '4.0'} / 5.0
                    </td>
                    <td className="px-6 py-4">
                      {c.is_claimed ? (
                        <span className="text-xs font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-2.5 py-1 rounded-full">
                          Claimed ({c.claimed_by_name || 'L2 Interviewer'})
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                          Available in L2 Pool
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.is_claimed ? (
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/l2/${c.application_id}/dossier`}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg"
                          >
                            Open Dossier &rarr;
                          </Link>
                          <button
                            onClick={() => handleRelease(c.application_id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700"
                          >
                            Release
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(c.application_id)}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow"
                        >
                          Claim Candidate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

