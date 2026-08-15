'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function CreateDriveWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    job_title: '',
    job_description: '',
    min_cgpa: '7.0',
    degree: 'B.Tech / B.E Computer Science',
    camera_proctoring: true,
    phone_detection: true,
    tab_switch_limit: 3
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        job_title: form.job_title,
        job_description: form.job_description,
        eligibility_rules: {
          min_cgpa: parseFloat(form.min_cgpa),
          degree: form.degree
        },
        proctoring_config: {
          camera: form.camera_proctoring,
          phone: form.phone_detection,
          tab_switch_limit: form.tab_switch_limit
        }
      };
      const res = await apiClient.post('/drives', payload);
      // Publish immediately
      await apiClient.post(`/drives/${res.data.id}/publish`);
      router.push(`/drives/${res.data.id}`);
    } catch (err) {
      alert('Failed to publish drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Recruitment Drive</h1>
        <p className="text-slate-400 mt-1">Step {step} of 3 — Configure your end-to-end recruitment campaign</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-3">Job Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Drive Campaign Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. AI Software Engineer Campus Drive 2026"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Job Title</label>
              <input
                type="text"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                placeholder="e.g. AI / ML Engineer"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
              <textarea
                rows={4}
                value={form.job_description}
                onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                placeholder="Outline core responsibilities, key technologies, and requirements..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.job_title}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-white disabled:opacity-50"
            >
              Next: Eligibility & Assessment &rarr;
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-3">Eligibility & Integrity</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Minimum CGPA / Percentage</label>
              <input
                type="text"
                value={form.min_cgpa}
                onChange={(e) => setForm({ ...form, min_cgpa: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium text-slate-300">AI Proctoring Guards</label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.camera_proctoring}
                  onChange={(e) => setForm({ ...form, camera_proctoring: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                Continuous Camera Face Presence & Multi-Face Detection
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.phone_detection}
                  onChange={(e) => setForm({ ...form, phone_detection: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                Phone & Suspicious Object Anomaly Detection
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-slate-300"
              >
                &larr; Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-white"
              >
                Next: Review & Publish &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-3">Review & Publish</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-500 font-medium">Title:</span> {form.title}</p>
              <p><span className="text-slate-500 font-medium">Role:</span> {form.job_title}</p>
              <p><span className="text-slate-500 font-medium">Min CGPA:</span> {form.min_cgpa}</p>
              <p><span className="text-slate-500 font-medium">Proctoring:</span> Camera & Phone Detection Enabled</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-slate-300"
              >
                &larr; Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Publishing Drive...' : '🚀 Publish & Activate Recruitment Drive'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
