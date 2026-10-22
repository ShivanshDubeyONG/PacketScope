import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TimeSeriesPoint } from '../../types';

interface TrafficTrendChartProps {
  timeSeries: TimeSeriesPoint[];
  darkMode?: boolean;
}

export const TrafficTrendChart: React.FC<TrafficTrendChartProps> = ({
  timeSeries,
  darkMode = true,
}) => {
  const [metric, setMetric] = useState<'packets' | 'bytes'>('packets');

  const chartData = (timeSeries || []).map((pt, idx) => ({
    time: pt.timestamp.split(' ')[1] || `+${idx}s`,
    packets: pt.packet_count,
    bytes: pt.byte_count,
    fullTime: pt.timestamp,
  }));

  return (
    <div
      className={`rounded-xl p-5 border shadow-card transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm tracking-tight">Traffic Over Time</h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Timeline of packet arrival and wire throughput across capture duration
          </p>
        </div>

        {/* Tab pills */}
        <div
          className={`flex items-center p-0.5 rounded-lg border text-xs ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200/70'
          }`}
        >
          <button
            onClick={() => setMetric('packets')}
            className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
              metric === 'packets'
                ? darkMode
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                  : 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Packets
          </button>
          <button
            onClick={() => setMetric('bytes')}
            className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
              metric === 'bytes'
                ? darkMode
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                  : 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bytes
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No packet timeline data recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="lightBlueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? '#1e293b' : '#f1f5f9'}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: darkMode ? '#334155' : '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white text-xs rounded-lg p-2.5 shadow-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-1">{data.fullTime}</div>
                        <div className="font-bold text-sky-400 font-mono">
                          {metric === 'packets'
                            ? `${data.packets} packets`
                            : `${data.bytes} bytes`}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#lightBlueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
