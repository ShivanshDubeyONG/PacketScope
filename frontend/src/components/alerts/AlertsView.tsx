import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode,
} from 'lucide-react';
import { Alert, AlertListResponse } from '../../types';

interface AlertsViewProps {
  alertsData: AlertListResponse | null;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alertsData }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const alerts = alertsData?.items || [];

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity.toUpperCase() === severityFilter;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Anomalies &amp; Detection Evidence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic security alerts triggered against traffic patterns with explainable evidence
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/90 shadow-sm text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSeverityFilter(filter)}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                severityFilter === filter
                  ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-card">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Anomaly Alerts In This Category</h3>
          <p className="text-xs text-slate-500 mt-1">
            Capture traffic conforms to standard baseline limits for this severity level.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            let parsedEvidence: any = null;
            try {
              parsedEvidence = JSON.parse(alert.evidence);
            } catch {
              parsedEvidence = alert.evidence;
            }

            return (
              <div
                key={alert.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden hover:border-slate-300 transition-all duration-200"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2 rounded-lg border text-xs font-bold uppercase shrink-0 mt-0.5 ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {alert.rule_id}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          • {alert.event_count} events
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {alert.explanation}
                      </p>

                      {/* Endpoints involved */}
                      {(alert.source_ip || alert.dest_ip) && (
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
                          {alert.source_ip && (
                            <span>
                              Src: <strong className="text-slate-700">{alert.source_ip}</strong>
                              {alert.source_port ? `:${alert.source_port}` : ''}
                            </span>
                          )}
                          {alert.dest_ip && (
                            <span>
                              Dst: <strong className="text-slate-700">{alert.dest_ip}</strong>
                              {alert.dest_port ? `:${alert.dest_port}` : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                    {/* Defensive Recommendation */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 text-sky-700 font-bold mb-1 text-[11px] uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 text-sky-600" />
                        Defensive Mitigation Guidance
                      </div>
                      <p className="text-slate-600 leading-relaxed">{alert.recommendation}</p>
                    </div>

                    {/* Evidence Data Box */}
                    <div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase mb-1.5">
                        <span className="flex items-center gap-1">
                          <FileCode className="w-3.5 h-3.5 text-slate-400" />
                          Structured Forensic Evidence
                        </span>
                      </div>
                      <pre className="p-3 bg-slate-900 text-sky-300 font-mono rounded-lg text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                        {typeof parsedEvidence === 'object'
                          ? JSON.stringify(parsedEvidence, null, 2)
                          : String(parsedEvidence)}
                      </pre>
                    </div>

                    {/* Disclaimer */}
                    <div className="text-[10px] text-slate-500 italic bg-slate-100/70 p-2.5 rounded border border-slate-200">
                      {alert.disclaimer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
