import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Sparkles, ShieldCheck, ShieldAlert, Terminal, Eye } from 'lucide-react';
import { Capture, AlertListResponse } from '../../types';
import { cyberAudio } from '../../utils/cyberAudio';

interface Props {
  capture: Capture | null;
  alertsData: AlertListResponse | null;
  onOpen3D: () => void;
}

export function CyberHudBanner({ capture, alertsData, onOpen3D }: Props) {
  const [audioEnabled, setAudioEnabled] = useState(cyberAudio.enabled);
  const [tickerIndex, setTickerIndex] = useState(0);

  const alerts = alertsData?.items || [];
  const hasCritical = alerts.some((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  const tickerMessages = [
    `DISSECTOR ENGINE: PYSHARK + TSHARK ACTIVE`,
    `CAPTURE HASH: ${capture?.file_hash_sha256?.slice(0, 16) || 'STANDALONE_DEMO'}...`,
    `DETERMINISTIC RULES: 8 ENGINE MODULES ONLINE`,
    `PAYLOAD PRIVACY: ZERO CREDENTIAL LEAKAGE ENFORCED`,
    `DATABASE ENGINE: SQLITE 3 WAL-MODE PRAGMA ON`,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [tickerMessages.length]);

  const toggleSound = () => {
    const newState = cyberAudio.toggle();
    setAudioEnabled(newState);
  };

  const fireConfetti = () => {
    cyberAudio.playSonarPing();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#0284c7', '#0ea5e9', '#3b82f6', '#10b981'],
    });
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3 text-slate-100 shadow-xl ring-1 ring-sky-500/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Ticker */}
        <div className="flex items-center space-x-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40">
            <Terminal className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">TELEMETRY:</span>
            <span className="font-semibold text-sky-300 tracking-wide transition-all duration-300">
              {tickerMessages[tickerIndex]}
            </span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-2">
          {/* Quick 3D Launcher */}
          <button
            onClick={() => {
              cyberAudio.playChirp();
              onOpen3D();
            }}
            className="flex items-center space-x-1.5 rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/40 hover:bg-sky-500/30 transition shadow-sm"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Launch 3D Universe</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            title={audioEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono transition ring-1 ${
              audioEnabled
                ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                : 'bg-slate-800 text-slate-400 ring-slate-700 hover:text-white'
            }`}
          >
            {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{audioEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* Confetti Celebration */}
          <button
            onClick={fireConfetti}
            title="Celebrate Verified Capture"
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-amber-300 ring-1 ring-slate-700 hover:bg-slate-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>

          {/* Threat Indicator Pill */}
          <div
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-bold ${
              hasCritical
                ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
            }`}
          >
            {hasCritical ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            <span>{hasCritical ? 'THREAT ANOMALIES DETECTED' : 'SYSTEM SECURE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
