import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { AlertListResponse } from '../../types';

interface AlertsSummaryCardProps {
  alertsData: AlertListResponse | null;
  onViewAll: () => void;
  darkMode?: boolean;
}

export const AlertsSummaryCard: React.FC<AlertsSummaryCardProps> = ({
  alertsData,
  onViewAll,
  darkMode = true,
}) => {
  const total = alertsData?.total ?? 0;
  const critical = alertsData?.critical_count ?? 0;
  const high = alertsData?.high_count ?? 0;

  const isNominal = total === 0;

  return (
    <div
      className={`rounded-xl p-5 border shadow-card transition-all duration-200 flex flex-col justify-between ${
        darkMode
          ? 'bg-slate-900 border-slate-800/90 text-slate-100 hover:border-slate-700'
          : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
            SECURITY ALERTS
          </span>
          <button
            onClick={onViewAll}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
          >
            View all →
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-2">
          {isNominal ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              NO ANOMALIES FLAGGED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20 uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              {total} EVENTS FLAGGED
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-400 font-medium mt-3 leading-relaxed line-clamp-2">
          {isNominal
            ? 'Traffic conforms to baseline rules without port scan or flooding signatures.'
            : `${critical} critical and ${high} high severity indicators require defensive review.`}
        </p>

        {/* Breakdown pill */}
        <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isNominal ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span>Active alert rules triggered:</span>
          <span className="font-bold text-white font-mono">{total}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-slate-800/60 mt-3">
        <button
          onClick={onViewAll}
          className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-colors text-center"
        >
          Inspect Security Alerts
        </button>
      </div>
    </div>
  );
};
