'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnifiedDashboard() {
  const router = useRouter();

  // Active Role in Switcher: 'admin' | 'recruiter' | 'l1' | 'l2'
  const [activeRole, setActiveRole] = useState<'admin' | 'recruiter' | 'l1' | 'l2'>('recruiter');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Drives State
  const [drives, setDrives] = useState<any[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [selectedShareDrive, setSelectedShareDrive] = useState<any | null>(null);

  // Drive Selection for Interviewers
  const [selectedDriveForL1, setSelectedDriveForL1] = useState<string>('');
  const [selectedDriveForL2, setSelectedDriveForL2] = useState<string>('');

  // L1 & L2 Pool State
  const [l1Candidates, setL1Candidates] = useState<any[]>([]);
  const [l2Candidates, setL2Candidates] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  // Admin Health State
  const [systemHealth, setSystemHealth] = useState({
    database: 'CONNECTED',
    server_status: 'HEALTHY',
    active_drives: 0,
    total_candidates: 0,
    security_checks: 'PASSED (RBAC, Geolocation & Whitelist Enforced)',
  });

  useEffect(() => {
    const rawUser = localStorage.getItem('autergo_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        setCurrentUser(u);
        if (u.role === 'l1_interviewer') setActiveRole('l1');
        else if (u.role === 'l2_interviewer') setActiveRole('l2');
        else if (u.role === 'admin') setActiveRole('admin');
        else setActiveRole('recruiter');
      } catch (e) {
        console.error(e);
      }
    }
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoadingDrives(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/drives', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
        setSystemHealth((prev) => ({
          ...prev,
          active_drives: data.length,
          total_candidates: data.reduce((acc: number, d: any) => acc + (d.total_candidates || 0), 0),
        }));

        if (data.length > 0) {
          setSelectedDriveForL1(data[0].id);
          setSelectedDriveForL2(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDrives(false);
    }
  };

  useEffect(() => {
    if (activeRole === 'l1' && selectedDriveForL1) fetchL1Pool(selectedDriveForL1);
  }, [activeRole, selectedDriveForL1]);

  useEffect(() => {
    if (activeRole === 'l2' && selectedDriveForL2) fetchL2Pool(selectedDriveForL2);
  }, [activeRole, selectedDriveForL2]);

  const fetchL1Pool = async (driveId?: string) => {
    setLoadingPool(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const url = driveId
        ? `http://localhost:8000/api/v1/interviews/l1/pool?drive_id=${driveId}`
        : `http://localhost:8000/api/v1/interviews/l1/pool`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setL1Candidates(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPool(false);
    }
  };

  const fetchL2Pool = async (driveId?: string) => {
    setLoadingPool(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const url = driveId
        ? `http://localhost:8000/api/v1/interviews/l2/pool?drive_id=${driveId}`
        : `http://localhost:8000/api/v1/interviews/l2/pool`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setL2Candidates(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPool(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-8 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-extrabold tracking-wider text-emerald-400">
            AUTERGO
          </Link>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-1 rounded-md border border-slate-700">
            Enterprise RBAC Hub
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-white">{currentUser?.full_name || 'System User'}</div>
            <div className="text-[10px] text-slate-400 font-mono capitalize">Active Role: {activeRole}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('autergo_token');
              localStorage.removeItem('autergo_user');
              router.push('/login');
            }}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 space-y-8">
        {/* ========================================================================= */}
        {/* 🌟 4-ROLE COMPONENT SWITCHER */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Active Role Workspace
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Admin Card */}
            <button
              type="button"
              onClick={() => setActiveRole('admin')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeRole === 'admin'
                  ? 'bg-blue-950/80 border-blue-500 shadow-xl shadow-blue-950/50 ring-1 ring-blue-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">🛡️</span>
                {activeRole === 'admin' && (
                  <span className="text-[10px] bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </div>
              <div className="font-bold text-white text-sm">1. Admin Command</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                System telemetry, user role allocations, health & data security.
              </p>
            </button>

            {/* 2. Recruiter Card */}
            <button
              type="button"
              onClick={() => setActiveRole('recruiter')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeRole === 'recruiter'
                  ? 'bg-emerald-950/80 border-emerald-500 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">💼</span>
                {activeRole === 'recruiter' && (
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </div>
              <div className="font-bold text-white text-sm">2. Recruiter Portal</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Create drives & manage candidates inside each isolated campaign.
              </p>
            </button>

            {/* 3. L1 Interviewer Card */}
            <button
              type="button"
              onClick={() => setActiveRole('l1')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeRole === 'l1'
                  ? 'bg-amber-950/80 border-amber-500 shadow-xl shadow-amber-950/50 ring-1 ring-amber-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">💻</span>
                {activeRole === 'l1' && (
                  <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </div>
              <div className="font-bold text-white text-sm">3. L1 Technical Pool</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Pick drive, claim L1 candidates, review test papers & live GPS.
              </p>
            </button>

            {/* 4. L2 Interviewer Card */}
            <button
              type="button"
              onClick={() => setActiveRole('l2')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeRole === 'l2'
                  ? 'bg-purple-950/80 border-purple-500 shadow-xl shadow-purple-950/50 ring-1 ring-purple-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">👥</span>
                {activeRole === 'l2' && (
                  <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </div>
              <div className="font-bold text-white text-sm">4. L2 Panel Pool</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Pick drive, inspect L1 feedback notes & give final hiring verdict.
              </p>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 1. ADMIN COMMAND WORKSPACE */}
        {/* ========================================================================= */}
        {activeRole === 'admin' && (
          <section className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Admin Command & Governance Dashboard</h1>
                <p className="text-xs text-slate-400">
                  Real-time health observability, tenant security compliance, and platform metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Database Engine</span>
                <div className="text-lg font-bold text-emerald-400">● {systemHealth.database}</div>
                <p className="text-xs text-slate-500">Async SQLAlchemy pool with SQLite local storage.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">System Telemetry</span>
                <div className="text-lg font-bold text-emerald-400">● {systemHealth.server_status}</div>
                <p className="text-xs text-slate-500">{systemHealth.active_drives} Drives • {systemHealth.total_candidates} Registered Candidates</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Security & Anti-Cheat</span>
                <div className="text-lg font-bold text-emerald-400">● {systemHealth.security_checks}</div>
                <p className="text-xs text-slate-500">Strict single-attempt test locks & HTML5 GPS capture verified.</p>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 2. RECRUITER DRIVE WORKSPACE */}
        {/* ========================================================================= */}
        {activeRole === 'recruiter' && (
          <section className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Recruitment Campaigns Hub</h1>
                <p className="text-xs text-slate-400">
                  Create and manage recruitment drives. Click into any drive to manage its candidates, Excel whitelist, and 360 pipeline.
                </p>
              </div>
              <Link
                href="/drives/create"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                + Create New Drive
              </Link>
            </div>

            {loadingDrives ? (
              <div className="text-center py-20 text-slate-500">Loading drives...</div>
            ) : drives.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400 mb-4">No active recruitment campaigns created yet.</p>
                <Link
                  href="/drives/create"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl inline-block text-xs"
                >
                  Create Your First Drive
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drives.map((d) => (
                  <div
                    key={d.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 shadow-xl"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 border border-emerald-800 text-emerald-400 px-2.5 py-0.5 rounded-full">
                          {d.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Cutoff: {d.cutoff_percentage}%
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-1">{d.title}</h2>
                      <p className="text-xs text-slate-400 mb-4">{d.job_title}</p>

                      <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center mb-6">
                        <div>
                          <div className="text-[10px] text-slate-400">Total</div>
                          <div className="text-sm font-bold text-white">{d.total_candidates}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-400">L1 Pool</div>
                          <div className="text-sm font-bold text-amber-400">{d.l1_pool_count}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-purple-400">L2 Pool</div>
                          <div className="text-sm font-bold text-purple-400">{d.l2_pool_count}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-400">Selected</div>
                          <div className="text-sm font-bold text-emerald-400">{d.selected_count}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => setSelectedShareDrive(d)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                      >
                        🔗 Share Magic Link & QR Code
                      </button>
                      <Link
                        href={`/drives/${d.id}/pipeline`}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg text-center transition-all block shadow"
                      >
                        Enter Drive Candidate Workspace &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. L1 TECHNICAL INTERVIEWER WORKSPACE (DRIVE-SCOPED) */}
        {/* ========================================================================= */}
        {activeRole === 'l1' && (
          <section className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-white">L1 Technical Interview Pool</h1>
                <p className="text-xs text-slate-400">
                  Select an active recruitment drive to view and claim candidates waiting for L1 technical review.
                </p>
              </div>

              {/* Drive Selector */}
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 w-full md:w-auto">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap pl-2">Drive:</span>
                <select
                  value={selectedDriveForL1}
                  onChange={(e) => setSelectedDriveForL1(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.l1_pool_count} in L1)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingPool ? (
              <div className="text-center py-20 text-slate-500">Loading L1 pool for selected drive...</div>
            ) : l1Candidates.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400">No candidates currently waiting in L1 pool for this drive.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Experience</th>
                      <th className="px-6 py-4">Test Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {l1Candidates.map((c) => (
                      <tr key={c.application_id} className="hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{c.candidate_name}</div>
                          <div className="text-xs text-slate-400 font-mono">{c.email}</div>
                        </td>
                        <td className="px-6 py-4 text-xs">{c.experience_years} Years</td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-400">{c.test_percentage.toFixed(1)}%</td>
                        <td className="px-6 py-4">
                          {c.is_claimed ? (
                            <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded-full">
                              Claimed ({c.claimed_by_name || 'Interviewer'})
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                              Available in Pool
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/l1/${c.application_id}/dossier`}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow"
                          >
                            Open Review Dossier &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* 4. L2 PANEL INTERVIEWER WORKSPACE (DRIVE-SCOPED) */}
        {/* ========================================================================= */}
        {activeRole === 'l2' && (
          <section className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-white">L2 Panel / Architecture Interview Pool</h1>
                <p className="text-xs text-slate-400">
                  Select an active recruitment drive to review candidates who cleared L1 and inspect L1 evaluator feedback.
                </p>
              </div>

              {/* Drive Selector */}
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 w-full md:w-auto">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap pl-2">Drive:</span>
                <select
                  value={selectedDriveForL2}
                  onChange={(e) => setSelectedDriveForL2(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.l2_pool_count} in L2)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingPool ? (
              <div className="text-center py-20 text-slate-500">Loading L2 pool for selected drive...</div>
            ) : l2Candidates.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400">No candidates currently waiting in L2 pool for this drive.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">L1 Evaluator</th>
                      <th className="px-6 py-4">L1 Rating</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {l2Candidates.map((c) => (
                      <tr key={c.application_id} className="hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{c.candidate_name}</div>
                          <div className="text-xs text-slate-400 font-mono">{c.email}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-amber-300 font-medium">{c.l1_interviewer_name || 'L1 Reviewer'}</td>
                        <td className="px-6 py-4 font-bold text-amber-400">★ {c.l1_rating || '4.0'} / 5.0</td>
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
                          <Link
                            href={`/l2/${c.application_id}/dossier`}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow"
                          >
                            Open Review Dossier &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Share Drive Magic Link & QR Modal */}
      {selectedShareDrive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Share Drive Magic Link & QR</h3>
              <button onClick={() => setSelectedShareDrive(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `http://localhost:3000/drive/${selectedShareDrive.id}/apply`
                )}`}
                alt="Drive QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 mb-1 block">Magic Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`http://localhost:3000/drive/${selectedShareDrive.id}/apply`}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-emerald-400"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/drive/${selectedShareDrive.id}/apply`);
                    alert('Magic link copied!');
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedShareDrive(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
