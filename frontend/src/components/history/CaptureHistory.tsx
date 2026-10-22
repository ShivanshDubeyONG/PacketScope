import React from 'react';
import { History, ArrowRight, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { Capture } from '../../types';

interface CaptureHistoryProps {
  captures: Capture[];
  currentCapture: Capture | null;
  onSelectCapture: (capture: Capture) => void;
  onOpenUpload: () => void;
}

export const CaptureHistory: React.FC<CaptureHistoryProps> = ({
  captures,
  currentCapture,
  onSelectCapture,
  onOpenUpload,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Capture History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical PCAP/PCAPNG analysis sessions recorded in local SQLite database
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors"
        >
          Upload Another Capture
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Capture Filename</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Packets</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Upload Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {captures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No historical captures found in the database.
                  </td>
                </tr>
              ) : (
                captures.map((cap) => {
                  const isCurrent = currentCapture?.id === cap.id;
                  return (
                    <tr
                      key={cap.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrent ? 'bg-sky-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>{cap.original_filename}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded font-sans uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {cap.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {cap.packet_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {cap.duration_seconds.toFixed(2)}s
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={
                            cap.risk_score >= 80
                              ? 'text-rose-600'
                              : cap.risk_score >= 50
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {cap.risk_score} / 100 ({cap.risk_level})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {cap.created_at ? new Date(cap.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectCapture(cap)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sky-600 hover:text-sky-700 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
