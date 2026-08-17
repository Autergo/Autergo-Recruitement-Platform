'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CandidateTakeAssessment() {
  const params = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes default
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);

  useEffect(() => {
    // Load stored questions
    const rawQ = localStorage.getItem('candidate_assessment_questions');
    if (rawQ) {
      try {
        setQuestions(JSON.parse(rawQ));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default questions fallback
      setQuestions([
        {
          id: 'q-1',
          title: 'What is the average time complexity of searching in a hash table?',
          question_type: 'single_mcq',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
          marks: 5,
        },
        {
          id: 'q-2',
          title: 'Write a Python function `solution(s)` that reverses string `s`.',
          question_type: 'coding',
          boilerplate: 'def solution(s):\n    pass',
          marks: 10,
        },
      ]);
    }

    const dur = localStorage.getItem('candidate_duration_minutes');
    if (dur) setTimeLeft(Number(dur) * 60);

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Attempt entering fullscreen immediately on load
    enterFullscreen();

    // Check fullscreen state changes
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        logTelemetryViolation('FULLSCREEN_EXIT');
        setShowFocusModal(true);
      } else {
        setShowFocusModal(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Proctoring: Detect Tab Switches & Focus Loss (Laptop & Mobile Web)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logTelemetryViolation('TAB_SWITCH_OR_MINIMIZED');
        setShowFocusModal(true);
      }
    };

    const handleWindowBlur = () => {
      logTelemetryViolation('WINDOW_FOCUS_LOST');
      setShowFocusModal(true);
    };

    const handleWindowFocus = () => {
      // Prompt candidate to resume fullscreen
      if (!document.fullscreenElement) {
        setShowFocusModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFocusModal(false);
    } catch (err) {
      console.warn('Fullscreen request blocked by browser policy:', err);
    }
  };

  const logTelemetryViolation = (eventType: string) => {
    setTabSwitchCount((prev) => {
      const updated = prev + 1;
      setWarningMsg(`⚠️ Integrity Alert: Violation #${updated} recorded (${eventType.replace(/_/g, ' ')}). Recruiter has been notified.`);
      setShowWarningToast(true);
      setTimeout(() => setShowWarningToast(false), 5000);
      return updated;
    });

    const token = localStorage.getItem('candidate_session_token');
    if (token) {
      fetch('http://localhost:8000/api/v1/public/proctoring/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_type: eventType, timestamp: new Date().toISOString() }),
      }).catch(console.error);
    }
  };

  const handleAnswerSelect = (val: any) => {
    const q = questions[currentIdx];
    if (q) {
      setAnswers({
        ...answers,
        [q.id]: val,
      });
    }
  };

  // Thank You / Terminal Termination Screen State
  const [testFinished, setTestFinished] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testFinished && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (testFinished && countdown === 0) {
      // Clear candidate session storage
      localStorage.removeItem('candidate_session_token');
      localStorage.removeItem('candidate_assessment_questions');
      localStorage.removeItem('candidate_duration_minutes');
      // Attempt window close / blank redirect
      try {
        window.close();
      } catch (e) {
        console.error(e);
      }
      // If browser prevents window.close, redirect to about:blank or terminating blank page
      window.location.href = 'about:blank';
    }
    return () => clearTimeout(timer);
  }, [testFinished, countdown]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('candidate_session_token');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      await fetch('http://localhost:8000/api/v1/public/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          answers,
          device_type: isMobile ? 'mobile' : 'laptop',
          proctoring_telemetry: {
            tab_switches: tabSwitchCount,
            device_type: isMobile ? 'mobile' : 'laptop',
          },
        }),
      });

      // Clear local session credentials immediately
      localStorage.removeItem('candidate_session_token');
      localStorage.removeItem('candidate_assessment_questions');
      localStorage.removeItem('candidate_duration_minutes');

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      setTestFinished(true);
    } catch (err) {
      console.error(err);
      setTestFinished(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (testFinished) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Assessment Submitted</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Thank you for completing the technical assessment. Your responses, proctoring telemetry, and timestamps have been securely recorded.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
              🔒 Session Terminated
            </div>
            <div className="text-3xl font-mono font-extrabold text-white">
              {countdown}s
            </div>
            <p className="text-[11px] text-slate-500">
              This terminal session is locked. Closing window in {countdown} seconds...
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.close();
              window.location.href = 'about:blank';
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            Close Window Now
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || questions[0];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Proctoring & Timer Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-extrabold tracking-wider text-emerald-400">AUTERGO ASSESSMENT</span>
          <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-300">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {tabSwitchCount > 0 && (
            <span className="text-xs font-mono bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1 rounded-full font-bold animate-pulse">
              ⚠️ {tabSwitchCount} Tab Switch Violation(s)
            </span>
          )}
          <div className="text-sm font-mono font-bold bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
            ⏳ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Warning Toast */}
      {showWarningToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-xs font-bold px-6 py-3 rounded-full shadow-2xl animate-bounce">
          {warningMsg}
        </div>
      )}

      {/* Main Question & Answering Area */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1 flex flex-col justify-between">
        {currentQ && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-3 py-1 rounded">
                {currentQ.question_type === 'coding' ? '💻 Coding Challenge' : '📝 Multiple Choice Question'}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                Marks: {currentQ.marks}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white leading-relaxed">{currentQ.title}</h2>

            {currentQ.question_type === 'single_mcq' ? (
              <div className="space-y-3 pt-4">
                {(currentQ.options || []).map((opt: string) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswerSelect(opt)}
                      className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <span className="text-emerald-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="pt-2">
                <label className="text-xs text-slate-400 mb-2 block font-mono">Solution Code (Python / JS)</label>
                <textarea
                  rows={8}
                  value={answers[currentQ.id] || currentQ.boilerplate || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Question Navigation Controls */}
        <div className="flex justify-between items-center pt-8 border-t border-slate-800 mt-8">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 disabled:opacity-40"
          >
            &larr; Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold ${
                  currentIdx === i
                    ? 'bg-emerald-500 text-slate-950'
                    : answers[questions[i]?.id]
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </main>

      {/* Focus & Fullscreen Enforcement Overlay */}
      {showFocusModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/80 rounded-3xl p-8 shadow-2xl space-y-6 animate-pulse">
            <div className="w-16 h-16 bg-rose-950 border border-rose-800 text-rose-400 rounded-full flex items-center justify-center text-3xl mx-auto">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Full-Screen Focus Required</h2>
              <p className="text-xs text-rose-300 mt-2 leading-relaxed">
                Tab switching, minimizing the browser, or exiting full-screen mode violates assessment integrity and is reported immediately to the recruiter.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
              Violations Logged: <strong className="text-rose-400">{tabSwitchCount}</strong>
            </div>

            <button
              type="button"
              onClick={enterFullscreen}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all"
            >
              Resume Assessment in Full-Screen &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
