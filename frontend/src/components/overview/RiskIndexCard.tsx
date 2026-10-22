import React from 'react';
import { Info } from 'lucide-react';
import { Capture } from '../../types';

interface RiskIndexCardProps {
  capture: Capture | null;
  onViewAlerts: () => void;
  darkMode?: boolean;
}

export const RiskIndexCard: React.FC<RiskIndexCardProps> = ({ capture, onViewAlerts, darkMode = true }) => {
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
    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-card border border-slate-800/90 flex flex-col justify-between relative overflow-hidden">
      {/* Background subtle light-blue glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header - cleanly spaced to prevent wrapping or cramping */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
              RISK SCORE
            </span>
            <div className="group relative cursor-pointer shrink-0">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-md shadow-xl border border-slate-700 z-30">
                Composite heuristic risk score (0-100) calculated from deterministic rule weights.
              </div>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${getScoreColor()}`}>
            {level}
          </span>
        </div>

        {/* Score Display */}
        <div className="my-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight font-mono text-white">
              {score}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor()}`}
              style={{ width: `${Math.max(4, score)}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
          {score === 0
            ? 'No suspicious patterns or anomaly indicators flagged.'
            : `${level} threat suspicion: Multiple suspicious behavioral indicators detected.`}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[11px]">
        <div className="text-slate-400 text-[10px]">
          <span className="font-medium text-slate-400">Deterministic Rules</span>
        </div>
        <button
          onClick={onViewAlerts}
          className="text-sky-400 hover:text-sky-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
        >
          View Alerts →
        </button>
      </div>
    </div>
  );
};
