import React from 'react';
import { Info, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Capture } from '../../types';

interface RiskIndexCardProps {
  capture: Capture | null;
  onViewAlerts: () => void;
}

export const RiskIndexCard: React.FC<RiskIndexCardProps> = ({ capture, onViewAlerts }) => {
  const score = capture?.risk_score ?? 0;
  const level = capture?.risk_level ?? 'NONE';

  const getScoreColor = () => {
    if (score >= 80) return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    if (score >= 30) return 'text-sky-400 bg-sky-500/20 border-sky-500/30';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
  };

  const getProgressBarColor = () => {
    if (score >= 80) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]';
    if (score >= 60) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    if (score >= 30) return 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]';
    return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]';
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-card border border-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Background subtle light-blue glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              CAPTURE RISK SCORE
            </span>
            <div className="group relative cursor-pointer">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded shadow-lg border border-slate-700 z-30">
                Composite heuristic risk score (0-100) calculated from deterministic detection rule weights.
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreColor()}`}>
            {level} RISK
          </span>
        </div>

        {/* Score Display */}
        <div className="my-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
              {score}
            </span>
            <span className="text-sm text-slate-400 font-mono">/ 100</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor()}`}
              style={{ width: `${Math.max(4, score)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {score === 0
            ? 'No suspicious patterns or anomaly indicators flagged in this capture.'
            : `${level} threat suspicion: Multiple suspicious behavioral indicators detected.`}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px]">
        <div className="text-slate-400">
          <span className="text-slate-500 uppercase text-[9px] font-bold block">SCORING METHOD</span>
          <span className="font-medium text-slate-300">Deterministic Rules</span>
        </div>
        <button
          onClick={onViewAlerts}
          className="text-sky-400 hover:text-sky-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
        >
          View Alerts →
        </button>
      </div>
    </div>
  );
};
