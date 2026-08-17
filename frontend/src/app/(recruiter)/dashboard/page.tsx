'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RecruiterDashboard() {
  const router = useRouter();
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShareDrive, setSelectedShareDrive] = useState<any | null>(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/drives', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            <Link href="/dashboard" className="text-white border-b-2 border-emerald-500 pb-1">
              Recruiter Drives
            </Link>
            <Link href="/l1" className="text-slate-400 hover:text-white transition-all">
              L1 Interview Pool
            </Link>
            <Link href="/l2" className="text-slate-400 hover:text-white transition-all">
              L2 Interview Pool
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/drives/create"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow transition-all"
          >
            + Create Recruitment Drive
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Recruitment Campaigns & Pipelines</h1>
            <p className="text-sm text-slate-400">
              Manage drives, distribute Magic Links & QR codes, and track candidate progression.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading drives...</div>
        ) : drives.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-4">No active recruitment drives created yet.</p>
            <Link
              href="/drives/create"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg inline-block"
            >
              Launch Your First Drive
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drives.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
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

                  {/* Stage Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-center mb-6">
                    <div>
                      <div className="text-xs text-slate-400">Total</div>
                      <div className="text-sm font-bold text-white">{d.total_candidates}</div>
                    </div>
                    <div>
                      <div className="text-xs text-amber-400">L1 Pool</div>
                      <div className="text-sm font-bold text-amber-400">{d.l1_pool_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-purple-400">L2 Pool</div>
                      <div className="text-sm font-bold text-purple-400">{d.l2_pool_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-emerald-400">Selected</div>
                      <div className="text-sm font-bold text-emerald-400">{d.selected_count}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedShareDrive(d)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    🔗 Share & QR
                  </button>
                  <Link
                    href={`/drives/${d.id}/pipeline`}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg text-center transition-all flex items-center justify-center"
                  >
                    Track Pipeline &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Share & QR Code Modal */}
      {selectedShareDrive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Share Recruitment Drive</h3>
              <button
                onClick={() => setSelectedShareDrive(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Candidates can scan this QR code on their laptop or mobile phone to register and take the test.
            </p>

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
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `http://localhost:3000/drive/${selectedShareDrive.id}/apply`
                    );
                    alert('Magic link copied to clipboard!');
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
