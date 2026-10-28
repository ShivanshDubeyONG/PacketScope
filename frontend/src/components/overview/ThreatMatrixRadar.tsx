import React, { useRef, useEffect, useState } from 'react';
import { Crosshair, Zap, ShieldAlert, Activity } from 'lucide-react';
import { Statistics, AlertListResponse } from '../../types';
import { cyberAudio } from '../../utils/cyberAudio';

interface Props {
  statistics: Statistics | null;
  alertsData: AlertListResponse | null;
}

interface NodePoint {
  id: string;
  ip: string;
  x: number;
  y: number;
  isThreat: boolean;
  bytes: number;
  packets: number;
  side: 'src' | 'dst';
}

interface FlowLink {
  source: NodePoint;
  target: NodePoint;
  bytes: number;
  isThreat: boolean;
}

export function ThreatMatrixRadar({ statistics, alertsData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'volume' | 'entropy'>('volume');
  const animRef = useRef<number>(0);

  const alertItems = alertsData?.items || [];
  const threatIps = new Set(alertItems.map((a) => a.source_ip).filter(Boolean));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.clientWidth * window.devicePixelRatio || 600);
    let height = (canvas.height = canvas.clientHeight * window.devicePixelRatio || 380);

    const conversations = statistics?.top_conversations || [];
    const srcIps = Array.from(new Set(conversations.map((c) => c.source_ip).filter(Boolean))).slice(0, 7);
    const dstIps = Array.from(new Set(conversations.map((c) => c.dest_ip).filter(Boolean))).slice(0, 7);

    // Fallbacks if conversations are small
    if (srcIps.length === 0) srcIps.push('192.168.1.50', '192.168.1.100', '10.0.0.12');
    if (dstIps.length === 0) dstIps.push('192.168.1.1', '8.8.8.8', '10.0.0.1');

    const srcNodes: NodePoint[] = srcIps.map((ip, i) => ({
      id: `src_${ip}`,
      ip,
      x: width * 0.18,
      y: (height / (srcIps.length + 1)) * (i + 1),
      isThreat: threatIps.has(ip),
      bytes: 12000 * (i + 1),
      packets: 30 * (i + 1),
      side: 'src',
    }));

    const dstNodes: NodePoint[] = dstIps.map((ip, i) => ({
      id: `dst_${ip}`,
      ip,
      x: width * 0.82,
      y: (height / (dstIps.length + 1)) * (i + 1),
      isThreat: false,
      bytes: 9000 * (i + 1),
      packets: 25 * (i + 1),
      side: 'dst',
    }));

    const links: FlowLink[] = [];
    srcNodes.forEach((s) => {
      dstNodes.forEach((d) => {
        const match = conversations.find((c) => c.source_ip === s.ip && c.dest_ip === d.ip);
        if (match || Math.random() > 0.6) {
          links.push({
            source: s,
            target: d,
            bytes: match ? match.byte_count : 8500,
            isThreat: s.isThreat,
          });
        }
      });
    });

    let pulseOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background cyber grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      pulseOffset += 0.035;

      // Draw Energy Chords (Bezier Curves)
      links.forEach((l) => {
        const isHighlighted = !selectedIp || l.source.ip === selectedIp || l.target.ip === selectedIp;
        const opacity = isHighlighted ? (l.isThreat ? 0.75 : 0.45) : 0.1;

        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        const cp1x = width * 0.45;
        const cp1y = l.source.y;
        const cp2x = width * 0.55;
        const cp2y = l.target.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, l.target.x, l.target.y);

        ctx.strokeStyle = l.isThreat ? `rgba(239, 68, 68, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
        ctx.lineWidth = isHighlighted ? (l.isThreat ? 3 : 2) : 1;
        ctx.stroke();

        // Animated traveling packet pulse along curve
        if (isHighlighted) {
          const t = (pulseOffset + l.bytes * 0.0001) % 1;
          const u = 1 - t;
          const px = u * u * u * l.source.x + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * l.target.x;
          const py = u * u * u * l.source.y + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * l.target.y;

          ctx.beginPath();
          ctx.arc(px, py, l.isThreat ? 4 : 3, 0, Math.PI * 2);
          ctx.fillStyle = l.isThreat ? '#f43f5e' : '#38bdf8';
          ctx.shadowColor = l.isThreat ? '#ef4444' : '#0284c7';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Nodes
      const allNodes = [...srcNodes, ...dstNodes];
      allNodes.forEach((n) => {
        const isSelected = selectedIp === n.ip;

        ctx.beginPath();
        ctx.arc(n.x, n.y, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = n.isThreat ? '#ef4444' : isSelected ? '#38bdf8' : '#0284c7';
        ctx.shadowColor = n.isThreat ? '#dc2626' : '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, isSelected ? 13 : 10, 0, Math.PI * 2);
        ctx.strokeStyle = n.isThreat ? 'rgba(239, 68, 68, 0.5)' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node IP text
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillStyle = isSelected ? '#ffffff' : n.isThreat ? '#fca5a5' : '#cbd5e1';
        ctx.textAlign = n.side === 'src' ? 'right' : 'left';
        ctx.fillText(n.ip, n.side === 'src' ? n.x - 16 : n.x + 16, n.y + 4);
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animRef.current);
  }, [statistics, alertsData, selectedIp]);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
              <span>HOST CONVERSATION CHORD MATRIX</span>
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-mono text-sky-300">
                DYNAMIC FLOW
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Bi-directional traffic chords • Laser pulse packet velocity
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedIp && (
            <button
              onClick={() => {
                setSelectedIp(null);
                cyberAudio.playClick();
              }}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-mono text-sky-400 hover:bg-slate-700"
            >
              Clear Filter ({selectedIp})
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Threat Host
            <span className="h-2 w-2 rounded-full bg-sky-400 ml-2" /> Normal Endpoint
          </span>
        </div>
      </div>

      <div className="relative w-full h-80 rounded-xl bg-slate-950/70 border border-slate-800/80 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-3 left-4 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          ◀ Source Initiators
        </div>
        <div className="absolute top-3 right-4 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Target Responders ▶
        </div>
      </div>
    </div>
  );
}
