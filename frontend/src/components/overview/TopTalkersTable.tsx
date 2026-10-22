import React from 'react';
import { TopTalker } from '../../types';

interface TopTalkersTableProps {
  topTalkers: TopTalker[];
  totalPackets: number;
}

export const TopTalkersTable: React.FC<TopTalkersTableProps> = ({ topTalkers, totalPackets }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">Top Talkers (Endpoints)</h3>
          <p className="text-[11px] text-slate-500">Highest volume source & destination IP addresses</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
              <th className="pb-2.5">Endpoint IP</th>
              <th className="pb-2.5">Packets</th>
              <th className="pb-2.5">Share</th>
              <th className="pb-2.5 text-right">Throughput</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topTalkers.slice(0, 5).map((t, idx) => {
              const pct = totalPackets > 0 ? ((t.packet_count / totalPackets) * 100).toFixed(1) : '0';
              return (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 font-mono text-slate-800 font-semibold">{t.ip}</td>
                  <td className="py-2.5 font-mono text-slate-600">{t.packet_count}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Number(pct))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 font-mono text-slate-600 text-right">
                    {(t.byte_count / 1024).toFixed(1)} KB
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
