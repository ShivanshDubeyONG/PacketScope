import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProtocolChartProps {
  distribution: Record<string, number>;
  darkMode?: boolean;
}

const COLORS = [
  '#0284c7', // brand-600
  '#38bdf8', // brand-400 (light light blue)
  '#06b6d4', // cyan-500
  '#818cf8', // indigo-400
  '#c084fc', // purple-400
  '#64748b', // slate-500
];

export const ProtocolChart: React.FC<ProtocolChartProps> = ({ distribution, darkMode = true }) => {
  const data = Object.entries(distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div
      className={`rounded-xl p-5 border shadow-card flex flex-col justify-between transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm tracking-tight">
            Protocol Distribution
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {total} packets
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">
          Breakdown across transport and application protocols
        </p>

        {data.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
            No protocol distribution available
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      const pct = total > 0 ? ((Number(item.value) / total) * 100).toFixed(1) : 0;
                      return (
                        <div className="bg-slate-950 text-white text-xs rounded-lg p-2 shadow-xl border border-slate-800">
                          <span className="font-bold text-sky-400">{item.name}</span>: {item.value} pkts ({pct}%)
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60 text-xs mt-2">
        {data.slice(0, 4).map((item, idx) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <div
              key={item.name}
              className={`flex items-center justify-between p-1.5 rounded-lg border text-xs ${
                darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="font-semibold text-[11px] text-slate-300">{item.name}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 font-bold">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
