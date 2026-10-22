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
}

export const TrafficTrendChart: React.FC<TrafficTrendChartProps> = ({ timeSeries }) => {
  const [metric, setMetric] = useState<'packets' | 'bytes'>('packets');

  const chartData = (timeSeries || []).map((pt, idx) => ({
    time: pt.timestamp.split(' ')[1] || `+${idx}s`,
    packets: pt.packet_count,
    bytes: pt.byte_count,
    fullTime: pt.timestamp,
  }));

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-card">
      {/* Header matching Telemetry Trend in reference image */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Telemetry trend
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Packets and throughput volume over capture timeline
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs">
          <button
            onClick={() => setMetric('packets')}
            className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
              metric === 'packets'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Packets
          </button>
          <button
            onClick={() => setMetric('bytes')}
            className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
              metric === 'bytes'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bytes
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No telemetry points recorded
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-1">{data.fullTime}</div>
                        <div className="font-semibold text-sky-400 font-mono">
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
                stroke="#0ea5e9"
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
