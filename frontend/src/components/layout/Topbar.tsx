import React from 'react';
import { ChevronDown, Play, FileDown, Layers, ShieldCheck } from 'lucide-react';
import { Capture } from '../../types';

interface TopbarProps {
  captures: Capture[];
  currentCapture: Capture | null;
  onSelectCapture: (capture: Capture) => void;
  onOpenUpload: () => void;
  onExportClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  captures,
  currentCapture,
  onSelectCapture,
  onOpenUpload,
  onExportClick,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-10">
      {/* Left side: Capture selector bar matching reference image */}
      <div className="flex items-center gap-3">
        {/* Dataset / Capture Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-500 tracking-wider">CAPTURE</span>
          <div className="relative">
            <select
              value={currentCapture?.id || ''}
              onChange={(e) => {
                const found = captures.find((c) => c.id === e.target.value);
                if (found) onSelectCapture(found);
              }}
              className="bg-transparent font-medium text-slate-800 pr-5 focus:outline-none cursor-pointer appearance-none text-xs"
            >
              {captures.length === 0 && <option value="">No captures loaded</option>}
              {captures.map((cap) => (
                <option key={cap.id} value={cap.id}>
                  {cap.original_filename} ({cap.packet_count} pkts)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Tag */}
        {currentCapture && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {currentCapture.status.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              {(currentCapture.file_size / 1024).toFixed(1)} KB • {currentCapture.duration_seconds.toFixed(2)}s
            </span>
          </div>
        )}
      </div>

      {/* Right side: Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-sky-500/20"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>New Capture</span>
        </button>
      </div>
    </header>
  );
};
