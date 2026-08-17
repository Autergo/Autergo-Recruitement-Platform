'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CandidateApplyPage() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;

  const [drive, setDrive] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Step Management: 1: Email Check, 2: Confirm Info & Geolocation, 3: Proctoring Agreement
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [referralSource, setReferralSource] = useState('Direct');
  const [checkingWhitelist, setCheckingWhitelist] = useState(false);
  const [whitelistError, setWhitelistError] = useState('');
  const [geoLocation, setGeoLocation] = useState<any | null>(null);
  const [geoStatus, setGeoStatus] = useState<'pending' | 'captured' | 'denied'>('pending');
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

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingWhitelist(true);
    setWhitelistError('');

    try {
      const res = await fetch(`http://localhost:8000/api/v1/public/drive/${driveId}/check-whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.prefill) {
          setFullName(data.prefill.full_name || '');
          setPhone(data.prefill.phone || '');
          setExperienceYears(data.prefill.experience_years || 1);
          setReferralSource(data.prefill.referral_source || 'Excel Import');
        }
        setStep(2);
        captureGeoLocation();
      } else if (res.status === 423) {
        setWhitelistError('🔒 Your assessment session has already been used. Please contact the recruiter to reactivate your attempt.');
      } else {
        const errData = await res.json().catch(() => ({}));
        setWhitelistError(errData.detail || '❌ Your email is not authorized for this recruitment drive.');
      }
    } catch (err) {
      console.error(err);
      setWhitelistError('Network error checking candidate whitelist.');
    } finally {
      setCheckingWhitelist(false);
    }
  };

  const captureGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_meters: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
          setGeoStatus('captured');
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err);
          setGeoLocation({ error: err.message, status: 'denied', timestamp: new Date().toISOString() });
          setGeoStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleStartTest = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/public/drive/${driveId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          full_name: fullName,
          phone,
          experience_years: Number(experienceYears),
          referral_source: referralSource,
          geolocation: geoLocation || { status: 'unsupported' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('candidate_session_token', data.session_token);
        localStorage.setItem('candidate_assessment_questions', JSON.stringify(data.questions));
        localStorage.setItem('candidate_duration_minutes', data.duration_minutes);

        router.push(`/test/${data.attempt_id}/take`);
      } else {
        alert('Could not start test session.');
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

        {step === 1 && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Enter Your Whitelisted Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {whitelistError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300">
                {whitelistError}
              </div>
            )}

            <button
              type="submit"
              disabled={checkingWhitelist}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl transition-all text-sm mt-4 disabled:opacity-50"
            >
              {checkingWhitelist ? 'Checking Whitelist...' : 'Verify Email & Proceed &rarr;'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex justify-between items-center text-xs">
              <span className="text-emerald-300 font-bold">✓ Whitelist Verified for {email}</span>
              <span className="text-slate-400 font-mono">
                {geoStatus === 'captured' ? '📍 GPS Captured' : '🛰️ Locating...'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl text-sm"
              >
                Proceed to Proctoring &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proctoring Warning & Consent Modal (Step 3) */}
      {step === 3 && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-3xl">🛡️</span>
              <h2 className="text-xl font-bold text-white mt-2">Test Integrity & Proctoring Agreement</h2>
              <p className="text-xs text-slate-400 mt-1">
                Please acknowledge that your test session is single-attempt and proctored.
              </p>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>
                  <strong>Single-Attempt Lock:</strong> Once you start the test, this link is locked. If closed, only the recruiter can reactivate it.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>
                  <strong>Full-Screen & Tab-Switching:</strong> Navigating away or minimizing triggers immediate telemetry violations.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>
                  <strong>Live Geolocation:</strong> {geoStatus === 'captured' ? 'GPS location captured successfully.' : 'Location recorded.'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
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
                {submitting ? 'Starting Session...' : 'I Agree & Start Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
