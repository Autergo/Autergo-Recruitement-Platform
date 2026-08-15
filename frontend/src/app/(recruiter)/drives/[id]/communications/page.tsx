import React, { useState } from 'react';

export default function CommunicationsPage() {
  const [templates, setTemplates] = useState([
    {
      id: 'tmpl-1',
      name: 'Registration Confirmation',
      trigger_event: 'CANDIDATE_REGISTERED',
      subject: 'Welcome to {{company.name}} Campus Recruitment Drive',
      variables: ['{{candidate.name}}', '{{job.title}}', '{{company.name}}'],
    },
    {
      id: 'tmpl-2',
      name: 'Assessment Invitation & Magic Token',
      trigger_event: 'ASSESSMENT_INVITED',
      subject: 'Your Online Assessment Link for {{job.title}}',
      variables: ['{{candidate.name}}', '{{assessment.link}}', '{{assessment.duration}}'],
    },
    {
      id: 'tmpl-3',
      name: 'Technical Interview Invitation',
      trigger_event: 'SHORTLISTED',
      subject: 'Interview Invitation: Round 1 Technical for {{job.title}}',
      variables: ['{{candidate.name}}', '{{interview.date}}', '{{meeting.link}}'],
    },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Automated Communication Workflows</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure event-triggered email dispatches with variable validation and delivery analytics.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium shadow-md">
          + Create Custom Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {tmpl.trigger_event}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{tmpl.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{tmpl.subject}</p>

              <div className="space-y-1 mb-6">
                <span className="text-xs text-slate-500 font-semibold uppercase">Supported Safe Variables:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tmpl.variables.map((v, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-800">
              <button className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300">
                Edit Template
              </button>
              <button className="flex-1 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg text-xs font-semibold text-emerald-400">
                Send Test Email
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
