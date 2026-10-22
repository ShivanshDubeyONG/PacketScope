import React from 'react';
import { TopTalker } from '../../types';

interface TopTalkersTableProps {
  topTalkers: TopTalker[];
  totalPackets: number;
  darkMode?: boolean;
}

export const TopTalkersTable: React.FC<TopTalkersTableProps> = ({
  topTalkers,
  totalPackets,
  darkMode = true,
}) => {
  return (
    <div
      className={`rounded-xl p-5 border shadow-card transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm tracking-tight">Top Talkers (Endpoints)</h3>
          <p className="text-[11px] text-slate-400">Highest volume source &amp; destination IP addresses</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b text-[10px] font-bold uppercase ${
                darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'
              }`}
            >
              <th className="pb-2.5">Endpoint IP</th>
              <th className="pb-2.5">Packets</th>
              <th className="pb-2.5">Share</th>
              <th className="pb-2.5 text-right">Throughput</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {topTalkers.slice(0, 5).map((t, idx) => {
              const pct = totalPackets > 0 ? ((t.packet_count / totalPackets) * 100).toFixed(1) : '0';
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <td className="py-2.5 font-semibold text-sky-400">{t.ip}</td>
                  <td className={`py-2.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.packet_count}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-16 h-1.5 rounded-full overflow-hidden ${
                          darkMode ? 'bg-slate-800' : 'bg-slate-100'
                        }`}
                      >
                        <div
                          className="bg-sky-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, Number(pct))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{pct}%</span>
                    </div>
                  </td>
                  <td
                    className={`py-2.5 text-right ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
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
