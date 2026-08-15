'use client';

import React from 'react';

interface EventItem {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  confidence: number;
  description: string;
}

interface SuspicionTimelineProps {
  events?: EventItem[];
  onAdjudicate?: (eventId: string, decision: 'confirm' | 'ignore' | 'review') => void;
}

export default function SuspicionTimeline({
  events = [
    {
      id: 'ev-1',
      type: 'TAB_SWITCH',
      severity: 'medium',
      timestamp: '00:14:22',
      confidence: 0.99,
      description: 'Candidate switched away from full-screen browser window (Duration: 3.2s)',
    },
    {
      id: 'ev-2',
      type: 'PHONE_DETECTED',
      severity: 'critical',
      timestamp: '00:28:45',
      confidence: 0.94,
      description: 'Secondary mobile device object detected in camera bounding box',
    },
  ],
  onAdjudicate,
}: SuspicionTimelineProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Proctoring Suspicion Timeline & Evidence</h2>
          <p className="text-xs text-slate-400">Chronological anomaly feed with human reviewer adjudication</p>
        </div>
        <span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded text-slate-300">
          {events.length} Telemetry Flag(s) Recorded
        </span>
      </div>

      <div className="space-y-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className={`p-4 rounded-xl border flex justify-between items-center ${
              ev.severity === 'critical'
                ? 'bg-rose-950/30 border-rose-800/80'
                : 'bg-amber-950/30 border-amber-800/80'
            }`}
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    ev.severity === 'critical'
                      ? 'bg-rose-900 text-rose-200'
                      : 'bg-amber-900 text-amber-200'
                  }`}
                >
                  {ev.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">Timestamp: {ev.timestamp}</span>
                <span className="text-xs text-slate-400 font-mono">Confidence: {(ev.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-sm font-medium text-slate-200">{ev.description}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onAdjudicate?.(ev.id, 'ignore')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Ignore
              </button>
              <button
                onClick={() => onAdjudicate?.(ev.id, 'review')}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg"
              >
                Mark Review
              </button>
              <button
                onClick={() => onAdjudicate?.(ev.id, 'confirm')}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg"
              >
                Confirm Violation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
