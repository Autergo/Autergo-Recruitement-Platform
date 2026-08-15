import React from 'react';

interface Alert {
  id: string;
  candidateName: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface CommandProps {
  driveTitle: string;
  totalInvited: number;
  startedCount: number;
  activeCount: number;
  completedCount: number;
  alerts: Alert[];
}

export const LiveCommandCenter: React.FC<CommandProps> = ({
  driveTitle,
  totalInvited,
  startedCount,
  activeCount,
  completedCount,
  alerts
}) => {
  const completionPercentage = totalInvited > 0 ? Math.round((completedCount / totalInvited) * 100) : 0;

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold">{driveTitle} — Live Command Center</h1>
          <p className="text-sm text-slate-400">Real-time candidate telemetry & proctoring stream</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded text-sm font-medium">Pause Drive</button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium">Broadcast Message</button>
        </div>
      </div>

      {/* Metrics Counters */}
      <div className="grid grid-cols-4 gap-4 my-6">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">Total Invited</span>
          <p className="text-3xl font-bold">{totalInvited.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">Started</span>
          <p className="text-3xl font-bold">{startedCount.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">Active Now</span>
          <p className="text-3xl font-bold text-emerald-400">{activeCount.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">Completed</span>
          <p className="text-3xl font-bold text-blue-400">{completedCount.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="my-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex justify-between text-sm mb-2">
          <span>Overall Assessment Progress</span>
          <span className="font-semibold">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Live Alert Feed */}
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-rose-400">Live Proctoring Anomaly Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No high-risk anomalies detected.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-slate-900/80 rounded border border-rose-900/40 flex justify-between items-center">
                <div>
                  <span className="font-medium text-slate-200">{alert.candidateName}</span>
                  <span className="ml-3 px-2 py-0.5 text-xs rounded bg-rose-950 text-rose-300 font-mono">
                    {alert.eventType}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
