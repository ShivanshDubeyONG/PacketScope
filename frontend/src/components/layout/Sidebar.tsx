import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Search,
  Activity,
  History,
  FileDown,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
  engineOnline: boolean;
  tsharkAvailable: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  engineOnline,
  tsharkAvailable,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'alerts', label: 'Anomalies & Evidence', icon: ShieldAlert },
    { id: 'packets', label: 'Packet Explorer', icon: Search },
    { id: 'traffic', label: 'Traffic Intelligence', icon: Activity },
    { id: 'history', label: 'Historical & Reports', icon: History },
    { id: 'exports', label: 'Data Exports', icon: FileDown },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
              <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-lg">PacketScope</span>
                <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                  v1.0
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-normal">
            Web-Based PCAP & Network Traffic Analysis Platform
          </p>
        </div>

        {/* Upload Action Button */}
        <div className="px-3 pt-4">
          <button
            onClick={onOpenUpload}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs px-3.5 py-2.5 rounded-lg transition-all duration-200 shadow-sm shadow-sky-500/20 hover:shadow-sky-500/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Capture</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-500 pl-2'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Widget (Matching reference image) */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                engineOnline && tsharkAvailable
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-slate-700">
              {tsharkAvailable ? 'Engine Online' : 'TShark Missing'}
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            title="Refresh status"
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtle Theme/Security Badge */}
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <CheckCircle2 className="w-3 h-3 text-sky-500" />
            Defensive Sandbox
          </span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
            PyShark / TShark
          </span>
        </div>
      </div>
    </aside>
  );
};
