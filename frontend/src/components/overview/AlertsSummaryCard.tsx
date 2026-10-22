import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { AlertListResponse } from '../../types';

interface AlertsSummaryCardProps {
  alertsData: AlertListResponse | null;
  onViewAll: () => void;
}

export const AlertsSummaryCard: React.FC<AlertsSummaryCardProps> = ({ alertsData, onViewAll }) => {
  const total = alertsData?.total ?? 0;
  const critical = alertsData?.critical_count ?? 0;
  const high = alertsData?.high_count ?? 0;
  const medium = alertsData?.medium_count ?? 0;
  const low = alertsData?.low_count ?? 0;

  const isNominal = total === 0;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="font-bold text-slate-900 text-sm tracking-tight">
            Security Alerts
          </span>
          <button
            onClick={onViewAll}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition-colors"
          >
            View all
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-2.5">
          {isNominal ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md border border-emerald-200 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              NO ANOMALIES FLAGGED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-md border border-rose-200 uppercase">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              {total} SUSPICIOUS EVENTS FLAGGED
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 font-medium mt-3 leading-relaxed">
          {isNominal
            ? 'Traffic patterns conform to expected baselines without suspicious port scans or floods.'
            : `${critical} critical and ${high} high severity indicators require defensive investigation.`}
        </p>

        {/* Breakdown pill */}
        <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isNominal ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>Active alert rules triggered:</span>
          <span className="font-bold text-slate-800 font-mono">{total}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 mt-2">
        <button
          onClick={onViewAll}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors text-center"
        >
          Inspect Security Alerts
        </button>
      </div>
    </div>
  );
};
