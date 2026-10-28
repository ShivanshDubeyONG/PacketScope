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
  Network,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
  engineOnline: boolean;
  tsharkAvailable: boolean;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  engineOnline,
  tsharkAvailable,
  darkMode,
  setDarkMode,
}) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cyber3d', label: '3D Threat Universe', icon: Globe },
    { id: 'packets', label: 'Packet Explorer', icon: Search },
    { id: 'alerts', label: 'Security Alerts', icon: ShieldAlert },
    { id: 'traffic', label: 'Traffic Intelligence', icon: Activity },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'exports', label: 'Export Results', icon: FileDown },
  ];

  return (
    <aside
      className={`w-64 border-r flex flex-col justify-between h-screen sticky top-0 select-none z-20 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className={`p-5 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Network className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-lg">PacketScope</span>
                <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20">
                  v1.0
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            PCAP &amp; Network Traffic Analysis Platform
          </p>
        </div>

        {/* Upload Action Button */}
        <div className="px-3 pt-4">
          <button
            onClick={onOpenUpload}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-all duration-200 shadow-sm shadow-sky-500/20 hover:shadow-sky-500/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PCAP File</span>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? darkMode
                      ? 'bg-sky-500/15 text-sky-400 font-bold border-l-4 border-sky-400 pl-2'
                      : 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-500 pl-2'
                    : darkMode
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Widget */}
      <div
        className={`p-4 border-t space-y-3 ${
          darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                engineOnline && tsharkAvailable
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-medium text-slate-300">
              {tsharkAvailable ? 'Engine Online' : 'TShark Missing'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-1 rounded transition-colors ${
                darkMode
                  ? 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => window.location.reload()}
              title="Refresh status"
              className={`p-1 rounded transition-colors ${
                darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] ${
            darkMode
              ? 'bg-slate-800/80 border-slate-700/80 text-slate-400'
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            Defensive Mode
          </span>
          <span className="text-[10px] bg-slate-900/60 text-sky-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">
            PyShark Dissector
          </span>
        </div>
      </div>
    </aside>
  );
};
