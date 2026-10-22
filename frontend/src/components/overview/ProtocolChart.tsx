import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProtocolChartProps {
  distribution: Record<string, number>;
}

const COLORS = [
  '#0284c7', // brand-600
  '#38bdf8', // brand-400 (light light blue accent)
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#94a3b8', // slate-400
];

export const ProtocolChart: React.FC<ProtocolChartProps> = ({ distribution }) => {
  const data = Object.entries(distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Diagnostic domains
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {total} total frames
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mb-4">
          Protocol distribution across dissected packets
        </p>

        {data.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
            No protocols analyzed
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
                  outerRadius={75}
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
                        <div className="bg-slate-900 text-white text-xs rounded-lg p-2 shadow-lg border border-slate-800">
                          <span className="font-bold text-sky-400">{item.name}</span>: {item.value} ({pct}%)
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
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
        {data.slice(0, 4).map((item, idx) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="font-semibold text-slate-700 text-[11px]">{item.name}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 font-bold">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
