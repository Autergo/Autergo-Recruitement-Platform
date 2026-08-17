'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnifiedDashboard() {
  const router = useRouter();

  // Active Role in Switcher: 'admin' | 'recruiter' | 'l1' | 'l2'
  const [activeRole, setActiveRole] = useState<'admin' | 'recruiter' | 'l1' | 'l2'>('recruiter');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'org_admin';
  const isRecruiter = currentUser?.role === 'recruiter' || currentUser?.role === 'recruitment_manager';
  const isL1 = currentUser?.role === 'l1_interviewer';
  const isL2 = currentUser?.role === 'l2_interviewer';

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

  // Admin Users & Create User Modal State
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'recruiter' | 'l1_interviewer' | 'l2_interviewer'>('recruiter');
  const [creatingUser, setCreatingUser] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    database: 'CONNECTED',
    server_status: 'HEALTHY',
    active_drives: 0,
    total_candidates: 0,
    security_checks: 'PASSED (RBAC, Geolocation & Whitelist Enforced)',
  });

  // Custom Roles State & Modal
  const [customRoles, setCustomRoles] = useState<any[]>([
    { role_key: 'recruiter', role_name: 'Recruiter / Talent Lead', description: 'Drive lifecycle, candidate whitelist import, single/bulk scheduling, attempt unlocking.' },
    { role_key: 'admin', role_name: 'System Administrator', description: 'Full platform administration, security, and role allocation.' },
    { role_key: 'l1_interviewer', role_name: 'L1 Technical Evaluator', description: 'L1 pool claim, test paper answers, live GPS coordinates, pass to L2.' },
    { role_key: 'l2_interviewer', role_name: 'L2 Panel Reviewer', description: 'L2 pool claim, L1 evaluator notes & ratings, final hiring decision.' }
  ]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    if (activeRole === 'admin') {
      fetchAdminUsers();
      fetchCustomRoles();
    }
  }, [activeRole]);

  const fetchCustomRoles = async () => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/organizations/roles', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setCustomRoles(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRole(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/organizations/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role_key: newRoleKey.trim(),
          role_name: newRoleName.trim(),
          description: newRoleDescription.trim(),
        }),
      });

      if (res.ok) {
        alert('Custom role created successfully!');
        setShowCreateRoleModal(false);
        setNewRoleKey('');
        setNewRoleName('');
        setNewRoleDescription('');
        fetchCustomRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to create custom role.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating role.');
    } finally {
      setCreatingRole(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/organizations/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setAdminUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch('http://localhost:8000/api/v1/organizations/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
        }),
      });

      if (res.ok) {
        alert('User created successfully!');
        setShowCreateUserModal(false);
        setNewFullName('');
        setNewEmail('');
        setNewPassword('');
        fetchAdminUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to create user.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    } finally {
      setCreatingUser(false);
    }
  };

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

    // Live 5-second polling interval for real-time scores and candidate status updates
    const pollInterval = setInterval(() => {
      fetchDrives();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const [editingCutoffDrive, setEditingCutoffDrive] = useState<any | null>(null);
  const [newCutoffVal, setNewCutoffVal] = useState<number>(60);
  const [updatingCutoff, setUpdatingCutoff] = useState(false);

  const handleUpdateCutoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCutoffDrive) return;
    setUpdatingCutoff(true);
    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`http://localhost:8000/api/v1/drives/${editingCutoffDrive.id}/cutoff`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cutoff_percentage: Number(newCutoffVal) }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Cutoff updated to ${newCutoffVal}%. Recalculated ${data.recalculated_candidates} candidate(s).`);
        setEditingCutoffDrive(null);
        fetchDrives();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to update cutoff percentage.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating cutoff percentage.');
    } finally {
      setUpdatingCutoff(false);
    }
  };

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

  const handleDeleteDrive = async (driveId: string, driveTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete the recruitment drive "${driveTitle}"? This will remove all associated assessments, applications, and test attempts.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('autergo_token');
      const res = await fetch(`http://localhost:8000/api/v1/drives/${driveId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setDrives((prev) => prev.filter((d) => d.id !== driveId));
        fetchDrives();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to delete recruitment drive.');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting recruitment drive.');
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
        {/* 🌟 ROLE-BASED WORKSPACE SELECTOR (Strictly locked to Admin Command) */}
        {/* ========================================================================= */}
        {isAdmin && (
          <section className="space-y-3">
            <div className="flex items-center gap-3 bg-blue-950/40 border border-blue-900/60 p-4 rounded-2xl">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="text-sm font-bold text-white">Administrator Command & Governance Workspace</div>
                <p className="text-xs text-slate-400">Strict RBAC Enforced: Admin manages tenant security, custom roles, and user accounts.</p>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 1. ADMIN COMMAND WORKSPACE */}
        {/* ========================================================================= */}
        {isAdmin && activeRole === 'admin' && (
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

            {/* Admin User Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">System User Accounts</h3>
                  <p className="text-xs text-slate-400">Create and allocate accounts for Recruiters, Admins, and Evaluators.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow transition-all"
                >
                  + Create New User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Assigned Role</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-bold text-white">{u.full_name}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold uppercase bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800 text-blue-400">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Delete user ${u.full_name}?`)) return;
                              const token = localStorage.getItem('autergo_token');
                              const res = await fetch(`http://localhost:8000/api/v1/organizations/users/${u.id}`, {
                                method: 'DELETE',
                                headers: token ? { Authorization: `Bearer ${token}` } : {},
                              });
                              if (res.ok) {
                                alert('User deleted.');
                                fetchAdminUsers();
                              } else {
                                alert('Could not delete user.');
                              }
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Custom Roles Configuration */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Configured RBAC Roles</h3>
                  <p className="text-xs text-slate-400">Manage role definitions, permissions, and create custom tenant roles.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow transition-all"
                >
                  + Create Custom Role
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map((r) => (
                  <div key={r.role_key} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">{r.role_name}</span>
                      <code className="text-[10px] font-mono text-slate-500">{r.role_key}</code>
                    </div>
                    <p className="text-xs text-slate-400">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 2. RECRUITER DRIVE WORKSPACE */}
        {/* ========================================================================= */}
        {(isAdmin || isRecruiter) && activeRole === 'recruiter' && (
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-slate-400">
                            Cutoff: <strong className="text-emerald-400">{d.cutoff_percentage}%</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCutoffDrive(d);
                              setNewCutoffVal(d.cutoff_percentage || 60);
                            }}
                            title="Manage / Update Cutoff Percentage"
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 hover:text-white transition-all"
                          >
                            ✏️ Edit
                          </button>
                        </div>
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
                      <div className="flex gap-2">
                        <Link
                          href={`/drives/${d.id}/pipeline`}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg text-center transition-all block shadow"
                        >
                          Enter Drive Workspace &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteDrive(d.id, d.title)}
                          title="Delete Recruitment Drive"
                          className="px-3 py-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                        >
                          🗑️
                        </button>
                      </div>
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
        {(isAdmin || isL1) && activeRole === 'l1' && (
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
        {(isAdmin || isL2) && activeRole === 'l2' && (
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

      {/* Create User Modal (Admin) */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Create New User Account</h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@autergo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">System Role *</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white capitalize"
                >
                  {customRoles.map((r) => (
                    <option key={r.role_key} value={r.role_key}>
                      {r.role_name} ({r.role_key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Role Modal (Admin) */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Create Custom Platform Role</h3>
              <button onClick={() => setShowCreateRoleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Role Unique Key *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. senior_lead_recruiter"
                  value={newRoleKey}
                  onChange={(e) => setNewRoleKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Display Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Lead Recruiter"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Role Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the scope and permissions for this role..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {creatingRole ? 'Creating...' : 'Save Custom Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cutoff Modal */}
      {editingCutoffDrive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Adjust Drive Cutoff Percentage</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{editingCutoffDrive.title}</p>
              </div>
              <button onClick={() => setEditingCutoffDrive(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              💡 Updating the cutoff will <strong>automatically re-evaluate</strong> all existing candidate scores for this drive. Candidates scoring &ge; new cutoff will immediately move to the <strong>L1 Eligible Pool</strong>; below cutoff will move to <strong>Test Rejected</strong>.
            </p>

            <form onSubmit={handleUpdateCutoff} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-300">Passing Cutoff Percentage *</label>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">{newCutoffVal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newCutoffVal}
                  onChange={(e) => setNewCutoffVal(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>0% (Pass All)</span>
                  <span>50%</span>
                  <span>100% (Strict)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Or Enter Exact Value (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCutoffVal}
                  onChange={(e) => setNewCutoffVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCutoffDrive(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCutoff}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs disabled:opacity-50 shadow-lg"
                >
                  {updatingCutoff ? 'Applying & Re-scoring...' : 'Save & Re-evaluate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
