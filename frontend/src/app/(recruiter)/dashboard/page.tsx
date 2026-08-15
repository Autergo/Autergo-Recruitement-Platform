'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Drive {
  id: string;
  title: string;
  job_title: string;
  status: string;
}

export default function RecruiterDashboard() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrives() {
      try {
        const res = await apiClient.get('/drives');
        setDrives(res.data);
      } catch (err) {
        console.error('Failed to load drives', err);
      } finally {
        setLoading(false);
      }
    }
    loadDrives();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment Drives</h1>
          <p className="text-slate-400 mt-1">Manage, monitor, and configure active hiring campaigns</p>
        </div>
        <Link
          href="/drives/create"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium shadow-md transition-all"
        >
          + Create New Drive
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading drives...</p>
      ) : drives.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">No recruitment drives created yet.</p>
          <Link href="/drives/create" className="text-emerald-400 hover:underline">
            Launch your first drive &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((d) => (
            <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  d.status === 'published' || d.status === 'live'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {d.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{d.title}</h2>
              <p className="text-sm text-slate-400 mb-6">{d.job_title}</p>
              <div className="flex gap-3">
                <Link
                  href={`/drives/${d.id}/live`}
                  className="flex-1 text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                >
                  Live Monitor
                </Link>
                <Link
                  href={`/drives/${d.id}`}
                  className="flex-1 text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
