import React, { useMemo } from 'react';
import { BarChart3, Radio, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import { Statistics } from '../../types';

interface Props {
  statistics: Statistics | null;
}

export function ProtocolSpectrum({ statistics }: Props) {
  const protocolDist = statistics?.protocol_distribution || {};

  // Compute Shannon Entropy H(X) = - sum(p * log2(p))
  const { entropy, entropyLevel, protoBars } = useMemo(() => {
    const entries = Object.entries(protocolDist);
    const total = entries.reduce((acc, [, count]) => acc + count, 0);

    let h = 0;
    const bars = entries.map(([proto, count]) => {
      const p = total > 0 ? count / total : 0;
      if (p > 0) {
        h -= p * Math.log2(p);
      }
      return {
        protocol: proto,
        count,
        percentage: (p * 100).toFixed(1),
        frequencyBars: Math.max(2, Math.min(16, Math.round(p * 16))),
      };
    });

    // Default bars if empty
    if (bars.length === 0) {
      ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'TLS'].forEach((p, idx) => {
        bars.push({
          protocol: p,
          count: (idx + 1) * 35,
          percentage: '16.6',
          frequencyBars: 6 + idx,
        });
      });
      h = 2.45;
    }

    let level = 'NORMAL DISPERSION';
    let color = 'text-sky-400';
    if (h > 3.2) {
      level = 'HIGH ENTROPY (Randomized / Tunneling)';
      color = 'text-amber-400';
    } else if (h < 1.4 && entries.length > 0) {
      level = 'LOW ENTROPY (Flooding Monoculture)';
      color = 'text-rose-400';
    }

    return { entropy: h.toFixed(2), entropyLevel: level, protoBars: bars };
  }, [protocolDist]);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
              <span>PROTOCOL SPECTRUM & SHANNON ENTROPY</span>
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-mono text-sky-300">
                FREQUENCY SPECTRUM
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audio-style frequency equalizer & traffic information entropy analysis
            </p>
          </div>
        </div>

        {/* Shannon Entropy Metric Tag */}
        <div className="flex items-center space-x-3 rounded-xl bg-slate-950/90 px-3.5 py-1.5 ring-1 ring-slate-800">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Shannon Entropy H(X)</div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-bold font-mono text-white">{entropy}</span>
              <span className="text-[10px] font-mono text-slate-400">bits/symbol</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <span className="text-[11px] font-mono font-medium text-sky-400">
            {entropyLevel}
          </span>
        </div>
      </div>

      {/* Futuristic Frequency Equalizer Visualizer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {protoBars.map((bar, i) => (
          <div
            key={bar.protocol}
            className="flex flex-col items-center justify-end rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-sky-500/50 transition-all group"
          >
            {/* Equalizer vertical bars */}
            <div className="flex items-end justify-center space-x-1 h-28 w-full mb-2">
              {[...Array(12)].map((_, stepIdx) => {
                const isActive = stepIdx < bar.frequencyBars;
                const isHigh = stepIdx > 8;
                return (
                  <div
                    key={stepIdx}
                    className={`w-1.5 rounded-sm transition-all duration-300 ${
                      isActive
                        ? isHigh
                          ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                          : stepIdx > 5
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                          : 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                        : 'bg-slate-800/40'
                    }`}
                    style={{ height: `${(stepIdx + 1) * 7.5}%` }}
                  />
                );
              })}
            </div>

            <span className="font-mono text-xs font-bold text-white tracking-wider group-hover:text-sky-400">
              {bar.protocol}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {bar.count.toLocaleString()} pkts ({bar.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
