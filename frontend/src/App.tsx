import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  ShieldAlert,
  Search,
  Activity,
  History,
  FileDown,
  Network,
  ShieldCheck,
} from 'lucide-react';

import { api } from './services/api';
import { Capture, Statistics, AlertListResponse, HealthStatus } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { RiskIndexCard } from './components/overview/RiskIndexCard';
import { MetricCard } from './components/overview/MetricCard';
import { AlertsSummaryCard } from './components/overview/AlertsSummaryCard';
import { TrafficTrendChart } from './components/overview/TrafficTrendChart';
import { ProtocolChart } from './components/overview/ProtocolChart';
import { TopTalkersTable } from './components/overview/TopTalkersTable';
import { TopConversations } from './components/overview/TopConversations';
import { UploadModal } from './components/upload/UploadModal';
import { AlertsView } from './components/alerts/AlertsView';
import { PacketExplorer } from './components/packets/PacketExplorer';
import { CaptureHistory } from './components/history/CaptureHistory';
import { ExportPanel } from './components/exports/ExportPanel';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [currentCapture, setCurrentCapture] = useState<Capture | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [alertsData, setAlertsData] = useState<AlertListResponse | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Graphite Dark mode state (defaults to true)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('packetscope_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('packetscope_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch (e) {
        console.error('Health check failed', e);
      }

      try {
        const capList = await api.listCaptures(0, 50);
        setCaptures(capList.items);
        if (capList.items.length > 0) {
          const first = capList.items[0];
          setCurrentCapture(first);
          loadCaptureData(first.id);
        }
      } catch (e) {
        console.error('Failed to list captures', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadCaptureData = async (captureId: string) => {
    try {
      const [stats, alerts] = await Promise.all([
        api.getStatistics(captureId).catch(() => null),
        api.getAlerts(captureId).catch(() => null),
      ]);
      setStatistics(stats);
      setAlertsData(alerts);
    } catch (err) {
      console.error('Failed to load capture data', err);
    }
  };

  const handleSelectCapture = (capture: Capture) => {
    setCurrentCapture(capture);
    loadCaptureData(capture.id);
  };

  const handleUploadSuccess = (newCapture: Capture) => {
    setCaptures((prev) => [newCapture, ...prev.filter((c) => c.id !== newCapture.id)]);
    setCurrentCapture(newCapture);
    loadCaptureData(newCapture.id);
    setActiveTab('overview');
  };

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        engineOnline={health?.status === 'ok'}
        tsharkAvailable={health?.tshark?.available ?? true}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          captures={captures}
          currentCapture={currentCapture}
          onSelectCapture={handleSelectCapture}
          onOpenUpload={() => setIsUploadOpen(true)}
          onExportClick={() => setActiveTab('exports')}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* If no captures exist yet */}
          {captures.length === 0 && !loading ? (
            <div
              className={`rounded-2xl p-10 border text-center shadow-card relative overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                PacketScope Network Traffic Analysis
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
                Turn raw packet captures into searchable traffic intelligence and explainable security alerts.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg shadow-sm shadow-sky-500/20 transition-all flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload &amp; Analyze PCAP File</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard / Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Page Title & Status Header - Generous spacing */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/40 mb-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1">
                        {currentCapture
                          ? `${currentCapture.original_filename} • CAPTURE ID: ${currentCapture.id.substring(0, 8)}`
                          : 'REAL-TIME PCAP TELEMETRY'}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Network Traffic Overview
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Turn raw packet captures into searchable traffic intelligence and explainable security alerts.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border flex items-center gap-1.5 ${
                          darkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                        PyShark Active
                      </span>
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border ${
                          darkMode
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                            : 'bg-sky-50 border-sky-200 text-sky-700'
                        }`}
                      >
                        Defensive Sandbox
                      </span>
                    </div>
                  </div>

                  {/* Top 4 Metrics Cards Row - Roomy gap-5 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* 1. Risk Score Card */}
                    <RiskIndexCard
                      capture={currentCapture}
                      onViewAlerts={() => setActiveTab('alerts')}
                      darkMode={darkMode}
                    />

                    {/* 2. Total Packets Card */}
                    <MetricCard
                      label="TOTAL PACKETS"
                      value={currentCapture?.packet_count.toLocaleString() ?? '—'}
                      subValue="packets"
                      subLabel={
                        currentCapture
                          ? `Capture duration: ${currentCapture.duration_seconds.toFixed(2)}s`
                          : undefined
                      }
                      secondaryInfo={[
                        {
                          label: 'PACKETS / SEC',
                          value: statistics?.packets_per_second.toFixed(1) ?? '—',
                        },
                        {
                          label: 'AVG SIZE',
                          value: `${statistics?.avg_packet_size.toFixed(0) ?? '—'} B`,
                        },
                      ]}
                      onClick={() => setActiveTab('packets')}
                      darkMode={darkMode}
                    />

                    {/* 3. Capture Volume Card */}
                    <MetricCard
                      label="CAPTURE VOLUME"
                      value={
                        currentCapture
                          ? (currentCapture.file_size / 1024).toFixed(1)
                          : '—'
                      }
                      subValue="KB"
                      subLabel={
                        statistics
                          ? `Wire volume: ${statistics.total_bytes.toLocaleString()} bytes`
                          : undefined
                      }
                      secondaryInfo={[
                        {
                          label: 'UNIQUE SRC',
                          value: statistics?.unique_src_ips ?? '—',
                        },
                        {
                          label: 'UNIQUE DST',
                          value: statistics?.unique_dst_ips ?? '—',
                        },
                      ]}
                      onClick={() => setActiveTab('traffic')}
                      darkMode={darkMode}
                    />

                    {/* 4. Security Alerts Card */}
                    <AlertsSummaryCard
                      alertsData={alertsData}
                      onViewAll={() => setActiveTab('alerts')}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Traffic Over Time & Protocol Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <TrafficTrendChart
                        timeSeries={statistics?.time_series || []}
                        darkMode={darkMode}
                      />
                    </div>
                    <div>
                      <ProtocolChart
                        distribution={statistics?.protocol_distribution || {}}
                        darkMode={darkMode}
                      />
                    </div>
                  </div>

                  {/* Top Talkers & Conversations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <TopTalkersTable
                      topTalkers={statistics?.top_talkers || []}
                      totalPackets={currentCapture?.packet_count || 0}
                      darkMode={darkMode}
                    />
                    <TopConversations
                      conversations={statistics?.top_conversations || []}
                      darkMode={darkMode}
                    />
                  </div>
                </div>
              )}

              {/* Security Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="animate-in fade-in duration-150">
                  <AlertsView alertsData={alertsData} />
                </div>
              )}

              {/* Packet Explorer Tab */}
              {activeTab === 'packets' && currentCapture && (
                <div className="animate-in fade-in duration-150">
                  <PacketExplorer captureId={currentCapture.id} />
                </div>
              )}

              {/* Traffic Intelligence Tab */}
              {activeTab === 'traffic' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Traffic Intelligence &amp; Endpoints
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Deep breakdown of endpoint conversations and port utilization
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <TopTalkersTable
                      topTalkers={statistics?.top_talkers || []}
                      totalPackets={currentCapture?.packet_count || 0}
                      darkMode={darkMode}
                    />
                    <TopConversations
                      conversations={statistics?.top_conversations || []}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Port Distribution Table */}
                  <div
                    className={`rounded-xl p-5 border shadow-card transition-colors ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <h3 className="font-bold text-sm tracking-tight mb-3">
                      Most Active Destination Ports
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statistics?.port_distribution || {}).map(
                        ([port, count]) => (
                          <div
                            key={port}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                              darkMode
                                ? 'bg-slate-800/80 border-slate-700/80'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="font-bold">Port {port}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-sky-400 font-bold">{count} pkts</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis History Tab */}
              {activeTab === 'history' && (
                <div className="animate-in fade-in duration-150">
                  <CaptureHistory
                    captures={captures}
                    currentCapture={currentCapture}
                    onSelectCapture={(cap) => {
                      handleSelectCapture(cap);
                      setActiveTab('overview');
                    }}
                    onOpenUpload={() => setIsUploadOpen(true)}
                  />
                </div>
              )}

              {/* Data Exports Tab */}
              {activeTab === 'exports' && (
                <div className="animate-in fade-in duration-150">
                  <ExportPanel currentCapture={currentCapture} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Upload Modal with 1-click Demo PCAPs */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;
