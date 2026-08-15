import React, { useState } from 'react';

interface CodeEditorProps {
  language?: string;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onRunTests?: (code: string) => Promise<any>;
}

export default function MonacoCodeEditor({
  language = 'python',
  initialCode = 'def solution(s):\n    # Implement your algorithm\n    return s[::-1]',
  onCodeChange,
  onRunTests,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([
    { id: 1, name: 'Test Case 1: Simple palindrome', input: '"racecar"', expected: '"racecar"', passed: true },
    { id: 2, name: 'Test Case 2: Multi-word string', input: '"hello world"', expected: '"dlrow olleh"', passed: true },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if (onCodeChange) onCodeChange(e.target.value);
  };

  const handleRun = async () => {
    setRunning(true);
    if (onRunTests) {
      const res = await onRunTests(code);
      if (res?.test_results) setTestResults(res.test_results);
    } else {
      setTimeout(() => setRunning(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Editor Toolbar */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
            {language} 3.12
          </span>
          <span className="text-xs text-slate-400">Isolated Sandboxed Runner</span>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all disabled:opacity-50"
        >
          {running ? 'Running Tests...' : '▶ Run Code & Assertions'}
        </button>
      </div>

      {/* Code Textarea / Editor Surface */}
      <div className="flex-1 min-h-[220px]">
        <textarea
          value={code}
          onChange={handleChange}
          spellCheck={false}
          className="w-full h-full p-4 bg-slate-950 text-emerald-300 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Test Case Output Terminal */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase text-slate-300">Test Cases Execution Panel</span>
          <span className="text-xs text-emerald-400 font-mono">
            {testResults.filter((t) => t.passed).length}/{testResults.length} Passed
          </span>
        </div>

        <div className="space-y-2">
          {testResults.map((tc) => (
            <div
              key={tc.id}
              className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                tc.passed
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}
            >
              <div>
                <span className="font-semibold mr-2">{tc.name}</span>
                <span className="text-slate-400 font-mono">Input: {tc.input}</span>
              </div>
              <span className="font-bold uppercase tracking-wider">
                {tc.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
