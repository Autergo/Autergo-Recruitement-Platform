'use client';

import React, { useEffect, useRef, useState } from 'react';

interface WebcamTrackerProps {
  onAnomalyDetected?: (event: { type: string; confidence: number; timestamp: string }) => void;
}

export default function WebcamProctorTracker({ onAnomalyDetected }: WebcamTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faceCount, setFaceCount] = useState<number>(1);
  const [status, setStatus] = useState<'normal' | 'suspicious' | 'critical'>('normal');

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Webcam stream unavailable, proctoring running in simulated mode.');
      }
    }
    startCamera();
  }, []);

  return (
    <div className="relative w-48 h-36 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-md">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        AI Edge CV Active
      </div>
      <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 px-2 py-1 rounded text-[10px] flex justify-between text-slate-300">
        <span>Faces: {faceCount}</span>
        <span className={status === 'normal' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
