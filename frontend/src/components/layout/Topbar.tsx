import React from 'react';
import { ChevronDown, FileDown, UploadCloud, Sun, Moon } from 'lucide-react';
import { Capture } from '../../types';

interface TopbarProps {
  captures: Capture[];
  currentCapture: Capture | null;
  onSelectCapture: (capture: Capture) => void;
  onOpenUpload: () => void;
  onExportClick: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  captures,
  currentCapture,
  onSelectCapture,
  onOpenUpload,
  onExportClick,
  darkMode,
  setDarkMode,
}) => {
  return (
    <header
      className={`border-b px-6 py-2.5 flex items-center justify-between sticky top-0 z-10 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Left side: Active Capture selector */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CAPTURE:</span>
          <div className="relative">
            <select
              value={currentCapture?.id || ''}
              onChange={(e) => {
                const found = captures.find((c) => c.id === e.target.value);
                if (found) onSelectCapture(found);
              }}
              className={`bg-transparent font-semibold pr-5 focus:outline-none cursor-pointer appearance-none text-xs font-mono ${
                darkMode ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              {captures.length === 0 && <option value="">No captures loaded</option>}
              {captures.map((cap) => (
                <option key={cap.id} value={cap.id} className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>
                  {cap.original_filename} ({cap.packet_count.toLocaleString()} packets)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {currentCapture && (
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase ${
                darkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              STATUS: {currentCapture.status.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              {(currentCapture.file_size / 1024).toFixed(1)} KB • {currentCapture.duration_seconds.toFixed(2)}s capture window
            </span>
          </div>
        )}
      </div>

      {/* Right side: Action Buttons & Theme toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-lg border transition-colors ${
            darkMode
              ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onExportClick}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Data</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-sky-500/20"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload PCAP</span>
        </button>
      </div>
    </header>
  );
};
