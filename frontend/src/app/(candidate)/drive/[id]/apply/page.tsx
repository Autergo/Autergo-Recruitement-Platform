'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CandidateApplyPage() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;

  const [drive, setDrive] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [referralSource, setReferralSource] = useState('Direct');

  // Proctoring Agreement Modal State
  const [showProctorModal, setShowProctorModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDriveDetails();
  }, [driveId]);

  const fetchDriveDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/public/drive/${driveId}`);
      if (res.ok) {
        const data = await res.json();
        setDrive(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProctorModal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowProctorModal(true);
  };

  const handleStartTest = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/public/drive/${driveId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          phone,
          experience_years: Number(experienceYears),
          referral_source: referralSource,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('candidate_session_token', data.session_token);
        localStorage.setItem('candidate_assessment_questions', JSON.stringify(data.questions));
        localStorage.setItem('candidate_duration_minutes', data.duration_minutes);

        // Redirect to assessment runner
        router.push(`/test/${data.attempt_id}/take`);
      } else {
        alert('Failed to register. Please check your details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to assessment server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading assessment details...</div>;
  }

  if (!drive) {
    return <div className="min-h-screen bg-slate-950 text-rose-400 flex items-center justify-center">Invalid or inactive drive link.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-[10px] font-mono uppercase tracking-widest bg-emerald-950 border border-emerald-800 text-emerald-400 px-3 py-1 rounded-full">
            Online Technical Assessment
          </span>
          <h1 className="text-2xl font-bold text-white mt-3 mb-1">{drive.title}</h1>
          <p className="text-sm text-slate-400">{drive.job_title}</p>
        </div>

        <form onSubmit={handleOpenProctorModal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Total Experience (Years)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Referral / Source</label>
            <select
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Direct">Direct Applicant</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Campus Placement">Campus Placement</option>
              <option value="Employee Referral">Employee Referral</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl transition-all text-sm mt-4"
          >
            Proceed to Proctoring & Assessment &rarr;
          </button>
        </form>
      </div>

      {/* Proctoring Warning & Consent Modal */}
      {showProctorModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-3xl">🛡️</span>
              <h2 className="text-xl font-bold text-white mt-2">Proctoring & Integrity Agreement</h2>
              <p className="text-xs text-slate-400 mt-1">
                Please read and acknowledge the test integrity rules before entering.
              </p>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>
                  <strong>Full-Screen Mode Required:</strong> Your test must remain in full-screen. Exiting full-screen is logged as a violation.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>
                  <strong>Tab & App Switching Tracking:</strong> Navigating away from this tab or minimizing the browser window triggers immediate telemetry alerts.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>
                  <strong>Laptop & Mobile Web Support:</strong> The test runner monitors focus events across both desktop browsers and mobile web.
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowProctorModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartTest}
                disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Starting...' : 'I Agree & Start Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
