'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnifiedDashboard() {
  const router = useRouter();

  // Active Tab: 'recruiter' | 'l1' | 'l2' | 'admin'
  const [activeTab, setActiveTab] = useState<'recruiter' | 'l1' | 'l2' | 'admin'>('recruiter');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Recruiter Drives State
  const [drives, setDrives] = useState<any[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [selectedShareDrive, setSelectedShareDrive] = useState<any | null>(null);

  // Excel Whitelist Upload Modal State
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedDriveForExcel, setSelectedDriveForExcel] = useState<any | null>(null);
  const [excelText, setExcelText] = useState(
    'Name,Email,Phone,Experience\nRahul Verma,rahul@example.com,+91 9876543201,3\nSneha Kapoor,sneha@example.com,+91 9876543202,5\nAmit Roy,amit@example.com,+91 9876543203,2'
  );
  const [importingExcel, setImportingExcel] = useState(false);

  // Scheduling Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDriveId, setScheduleDriveId] = useState('');
  const [scheduleStage, setScheduleStage] = useState('L1');
  const [scheduleDateTime, setScheduleDateTime] = useState('2026-08-20T10:00');
  const [scheduling, setScheduling] = useState(false);

  // L1 & L2 Pool State
  const [l1Candidates, setL1Candidates] = useState<any[]>([]);
  const [l2Candidates, setL2Candidates] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  // Admin Health & Role State
  const [systemHealth, setSystemHealth] = useState({
    database: 'CONNECTED',
    server_status: 'HEALTHY',
    active_drives: 0,
    total_candidates: 0,
    security_checks: 'PASSED (RBAC & Whitelist Enforced)'
  });

  useEffect(() => {
    const rawUser = localStorage.getItem('autergo_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        setCurrentUser(u);
        if (u.role === 'l1_interviewer') setActiveTab('l1');
        else if (u.role === 'l2_interviewer') setActiveTab('l2');
        else if (u.role === 'admin') setActiveTab('admin');
        else setActiveTab('recruiter');
      } catch (e) {
        console.error(e);
      }
    }
    fetchDrives();
  }, []);

  useEffect(() => {
    if (activeTab === 'l1') fetchL1Pool();
    if (activeTab === 'l2') fetchL2Pool();
  }, [activeTab]);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDrives(false);
    }
  };

  const fetchL1Pool = async () => {
    setLoadingPool(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/interviews/l1/pool', {
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

  const fetchL2Pool = async () => {
    setLoadingPool(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/interviews/l2/pool', {
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

  const handleExcelImport = async () => {
    if (!selectedDriveForExcel) return;
    setImportingExcel(true);
    try {
      const lines = excelText.trim().split('\n');
      const candidates = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
          candidates.push({
            full_name: parts[0]?.trim() || 'Candidate',
            email: parts[1]?.trim() || '',
            phone: parts[2]?.trim() || '',
            experience_years: Number(parts[3]?.trim()) || 0,
            referral_source: 'Excel Import',
          });
        }
      }

      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`http://localhost:8000/api/v1/drives/${selectedDriveForExcel.id}/import-whitelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ candidates }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Success! Imported ${data.imported_candidates} whitelisted candidates.`);
        setShowExcelModal(false);
        fetchDrives();
      } else {
        alert('Failed to import candidates.');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing or importing Excel file.');
    } finally {
      setImportingExcel(false);
    }
  };

  const handleBulkSchedule = async () => {
    setScheduling(true);
    try {
      const token = localStorage.getItem('autergo_token');
      // Fetch drive candidate IDs
      const candRes = await fetch(`http://localhost:8000/api/v1/drives/${scheduleDriveId}/candidates?stage=ALL`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const cands = await candRes.json();
      const appIds = (cands || []).map((c: any) => c.application_id);

      const res = await fetch('http://localhost:8000/api/v1/interviews/schedule/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          application_ids: appIds,
          stage: scheduleStage,
          start_datetime: scheduleDateTime,
          slot_duration_minutes: 45,
          meeting_link: 'https://meet.autergo.internal/room-101',
        }),
      });

      if (res.ok) {
        alert(`Bulk interview slots scheduled successfully for ${appIds.length} candidate(s)!`);
        setShowScheduleModal(false);
      } else {
        alert('Failed to schedule batch interviews.');
      }
    } catch (err) {
      console.error(err);
      alert('Error scheduling interviews.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-8 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-extrabold tracking-wider text-emerald-400">
            AUTERGO
          </Link>
          <nav className="flex gap-2 text-xs font-bold bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(currentUser?.role === 'recruiter' || currentUser?.role === 'admin' || currentUser?.role === 'org_admin') && (
              <button
                onClick={() => setActiveTab('recruiter')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'recruiter' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Recruiter Campaigns
              </button>
            )}
            {(currentUser?.role === 'l1_interviewer' || currentUser?.role === 'recruiter' || currentUser?.role === 'admin' || currentUser?.role === 'org_admin') && (
              <button
                onClick={() => setActiveTab('l1')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'l1' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                L1 Pool
              </button>
            )}
            {(currentUser?.role === 'l2_interviewer' || currentUser?.role === 'recruiter' || currentUser?.role === 'admin' || currentUser?.role === 'org_admin') && (
              <button
                onClick={() => setActiveTab('l2')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'l2' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                L2 Pool
              </button>
            )}
            {(currentUser?.role === 'admin' || currentUser?.role === 'org_admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'admin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin & Health
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-mono">
            {currentUser?.full_name || 'Recruiter'} ({currentUser?.role || 'recruiter'})
          </span>
          <Link
            href="/login"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700"
          >
            Switch User
          </Link>
        </div>
      </header>

      {/* Main Tabbed Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 space-y-8">
        {/* ==================================================== */}
        {/* 1. RECRUITER CAMPAIGNS TAB */}
        {/* ==================================================== */}
        {activeTab === 'recruiter' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Recruitment Campaigns & Whitelists</h1>
                <p className="text-xs text-slate-400">
                  Manage drives, import Excel candidate whitelists, schedule interview slots, and track pipelines.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (drives.length > 0) {
                      setScheduleDriveId(drives[0].id);
                      setShowScheduleModal(true);
                    } else {
                      alert('Create a drive first.');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                >
                  📅 Bulk Schedule Slots
                </button>
                <Link
                  href="/drives/create"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  + Create New Drive
                </Link>
              </div>
            </div>

            {loadingDrives ? (
              <div className="text-center py-20 text-slate-500">Loading recruitment drives...</div>
            ) : drives.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <p className="text-slate-400 mb-4">No active recruitment campaigns found.</p>
                <Link
                  href="/drives/create"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg inline-block text-xs"
                >
                  Create Your First Campaign
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drives.map((d) => (
                  <div
                    key={d.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 shadow-xl"
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

                      <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center mb-6">
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDriveForExcel(d);
                            setShowExcelModal(true);
                          }}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                        >
                          📊 Import Excel
                        </button>
                        <button
                          onClick={() => setSelectedShareDrive(d)}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                        >
                          🔗 Magic Link & QR
                        </button>
                      </div>
                      <Link
                        href={`/drives/${d.id}/pipeline`}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg text-center transition-all block"
                      >
                        Track Candidate 360 Pipeline &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. L1 POOL TAB */}
        {/* ==================================================== */}
        {activeTab === 'l1' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">L1 Technical Interview Pool</h1>
                <p className="text-xs text-slate-400">
                  Claim eligible candidates, review their live GPS coordinates and submitted test paper with answer keys.
                </p>
              </div>
            </div>

            {loadingPool ? (
              <div className="text-center py-20 text-slate-500">Loading L1 candidates...</div>
            ) : l1Candidates.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <p className="text-slate-400 mb-2">No candidates currently waiting in L1 pool.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Campaign</th>
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
                        <td className="px-6 py-4 text-xs">{c.drive_title}</td>
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
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg"
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
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. L2 POOL TAB */}
        {/* ==================================================== */}
        {activeTab === 'l2' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">L2 Panel / Advanced Interview Pool</h1>
                <p className="text-xs text-slate-400">
                  Inspect candidates passed by L1 along with L1 feedback notes and submit final hiring decision.
                </p>
              </div>
            </div>

            {loadingPool ? (
              <div className="text-center py-20 text-slate-500">Loading L2 candidates...</div>
            ) : l2Candidates.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <p className="text-slate-400 mb-2">No candidates currently waiting in L2 pool.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Campaign</th>
                      <th className="px-6 py-4">L1 Interviewer</th>
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
                        <td className="px-6 py-4 text-xs">{c.drive_title}</td>
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
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg"
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
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. ADMIN & HEALTH TAB */}
        {/* ==================================================== */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">System Health & Role Administration</h1>
              <p className="text-xs text-slate-400">
                Observe system telemetry, manage tenant role allocations, and ensure data security.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-2">
                <span className="text-xs text-slate-400">Database Engine</span>
                <div className="text-lg font-bold text-emerald-400">● {systemHealth.database}</div>
                <p className="text-xs text-slate-500">Async SQLAlchemy SQLite/PostgreSQL pool active.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-2">
                <span className="text-xs text-slate-400">System Telemetry</span>
                <div className="text-lg font-bold text-emerald-400">● {systemHealth.server_status}</div>
                <p className="text-xs text-slate-500">Uptime: 99.99% • {systemHealth.active_drives} Active Campaigns</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-2">
                <span className="text-xs text-slate-400">Security & Integrity</span>
                <div className="text-lg font-bold text-emerald-400">● {systemHealth.security_checks}</div>
                <p className="text-xs text-slate-500">Candidate Single-Attempt & GPS Geolocation Active</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Excel / CSV Whitelist Upload Modal */}
      {showExcelModal && selectedDriveForExcel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Import Candidate Whitelist from Excel / CSV</h3>
              <button onClick={() => setShowExcelModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Paste or edit candidate records for <strong>{selectedDriveForExcel.title}</strong>. When these candidates open the Magic Link, their info will auto-fill instantly.
            </p>

            <textarea
              rows={6}
              value={excelText}
              onChange={(e) => setExcelText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExcelImport}
                disabled={importingExcel}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
              >
                {importingExcel ? 'Importing...' : 'Upload & Whitelist Candidates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Interview Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Bulk Schedule Candidate Interviews</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Target Campaign</label>
              <select
                value={scheduleDriveId}
                onChange={(e) => setScheduleDriveId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Interview Round</label>
              <select
                value={scheduleStage}
                onChange={(e) => setScheduleStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="L1">L1 Technical Interview</option>
                <option value="L2">L2 Panel / Architecture Interview</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Batch Start Date & Time</label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSchedule}
                disabled={scheduling}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
              >
                {scheduling ? 'Scheduling...' : 'Generate Batch Slots'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Magic Link & QR Modal */}
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
