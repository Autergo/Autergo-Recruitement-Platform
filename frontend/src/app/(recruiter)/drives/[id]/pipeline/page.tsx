'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DrivePipelineTrackingPage() {
  const params = useParams();
  const driveId = params.id as string;

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, [driveId, filterStage]);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(
        `http://localhost:8000/api/v1/drives/${driveId}/candidates?stage=${filterStage}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">Registered</span>;
      case 'test_in_progress':
        return <span className="bg-blue-950 text-blue-400 border border-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">Test In Progress</span>;
      case 'test_rejected':
        return <span className="bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">Test Failed (&lt; Cutoff)</span>;
      case 'l1_eligible':
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">L1 Eligible (Pool)</span>;
      case 'l1_in_progress':
        return <span className="bg-amber-900 text-amber-300 border border-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">L1 In Progress</span>;
      case 'l1_rejected':
        return <span className="bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">L1 Rejected</span>;
      case 'l2_eligible':
        return <span className="bg-purple-950 text-purple-400 border border-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">L2 Eligible (Pool)</span>;
      case 'l2_in_progress':
        return <span className="bg-purple-900 text-purple-300 border border-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">L2 In Progress</span>;
      case 'l2_rejected':
        return <span className="bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">L2 Rejected</span>;
      case 'selected':
      case 'l2_cleared':
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">✓ Selected / Hired</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-extrabold tracking-wider text-emerald-400">
            AUTERGO
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-all">
              &larr; Back to Drives
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Candidate 360 Tracking Pipeline</h1>
            <p className="text-sm text-slate-400">
              Real-time progression tracking across all assessment and interview stages.
            </p>
          </div>

          {/* Stage Filters */}
          <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            {['ALL', 'L1_POOL', 'L2_POOL', 'SELECTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStage(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStage === st
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-2">No candidates found for this filter stage.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Candidate Profile</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Referral</th>
                  <th className="px-6 py-4">Current Stage & Status</th>
                  <th className="px-6 py-4">Test Score</th>
                  <th className="px-6 py-4 text-right">360 Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {candidates.map((c) => {
                  const meta = c.profile_info || {};
                  return (
                    <tr key={c.application_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{c.full_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{c.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">{meta.experience_years || 0} Years</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{meta.referral_source || 'Direct'}</td>
                      <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                        {meta.test_percentage !== undefined ? `${Number(meta.test_percentage).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCandidate(c)}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                        >
                          View 360 Dossier &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Candidate 360 Slide-Over Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-8 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-extrabold text-white">{selectedCandidate.full_name}</h2>
                <p className="text-xs text-slate-400 font-mono">{selectedCandidate.email} • {selectedCandidate.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Stage Status</label>
              <div>{getStatusBadge(selectedCandidate.status)}</div>
            </div>

            {/* Profile Metrics */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-500 block">Experience</span>
                <span className="text-sm font-bold text-slate-200">{selectedCandidate.profile_info?.experience_years || 0} Years</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Referral Source</span>
                <span className="text-sm font-bold text-slate-200">{selectedCandidate.profile_info?.referral_source || 'Direct'}</span>
              </div>
            </div>

            {/* Online Test Audit */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">1. Online Assessment Score</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Score Scored:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedCandidate.profile_info?.test_score || 0} / {selectedCandidate.profile_info?.test_total || 0} ({selectedCandidate.profile_info?.test_percentage?.toFixed(1) || 0}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Device Telemetry:</span>
                <span className="capitalize">{selectedCandidate.profile_info?.device_type || 'Laptop'}</span>
              </div>
            </div>

            {/* L1 Interview Audit */}
            {selectedCandidate.profile_info?.l1_decision && (
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">2. L1 Technical Interview</h3>
                  <span className="text-xs font-bold text-amber-300">
                    Verdict: {selectedCandidate.profile_info?.l1_decision} (★ {selectedCandidate.profile_info?.l1_rating}/5)
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Interviewer: <strong className="text-slate-200">{selectedCandidate.profile_info?.l1_interviewer_name || 'L1 Reviewer'}</strong>
                </div>
                <p className="text-xs text-slate-300 italic pt-1">
                  "{selectedCandidate.profile_info?.l1_feedback}"
                </p>
              </div>
            )}

            {/* L2 Interview Audit */}
            {selectedCandidate.profile_info?.l2_decision && (
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">3. L2 Panel Interview</h3>
                  <span className="text-xs font-bold text-purple-300">
                    Verdict: {selectedCandidate.profile_info?.l2_decision} (★ {selectedCandidate.profile_info?.l2_rating}/5)
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Interviewer: <strong className="text-slate-200">{selectedCandidate.profile_info?.l2_interviewer_name || 'L2 Reviewer'}</strong>
                </div>
                <p className="text-xs text-slate-300 italic pt-1">
                  "{selectedCandidate.profile_info?.l2_feedback}"
                </p>
              </div>
            )}

            {/* Rejection Audit (if rejected) */}
            {selectedCandidate.profile_info?.rejection_stage && (
              <div className="bg-rose-950/50 border border-rose-800/80 p-5 rounded-xl space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Rejection Audit Log</h3>
                <div className="text-xs text-slate-300">
                  Stage Rejected: <strong>{selectedCandidate.profile_info?.rejection_stage}</strong>
                </div>
                <div className="text-xs text-rose-300">
                  Reason: {selectedCandidate.profile_info?.rejection_reason}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
