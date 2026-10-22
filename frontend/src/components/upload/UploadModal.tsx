import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle, Loader2, FileCode, Play, ShieldAlert, Globe, Crosshair } from 'lucide-react';
import { api } from '../../services/api';
import { Capture } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (capture: Capture) => void;
  darkMode?: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  darkMode = true,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSet(e.target.files[0]);
    }
  };

  const validateAndSet = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.pcap', '.pcapng'].includes(ext)) {
      setError(`Unsupported extension '${ext}'. Only standard .pcap and .pcapng files are supported.`);
      return;
    }
    if (selectedFile.size === 0) {
      setError('Selected file is empty (0 bytes).');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError(`File size exceeds 50 MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setStage('Validating binary header and uploading capture...');

    try {
      setTimeout(() => setStage('Executing PyShark / TShark dissections...'), 600);
      setTimeout(() => setStage('Computing traffic aggregates & endpoints...'), 1400);
      setTimeout(() => setStage('Evaluating deterministic threat heuristics...'), 2200);

      const capture = await api.uploadCapture(file, true);
      setIsProcessing(false);
      onUploadSuccess(capture);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'An error occurred during capture analysis.');
    }
  };

  const handleLoadDemo = async (demoId: 'port_scan' | 'web_traffic' | 'multi_threat', name: string) => {
    setIsProcessing(true);
    setError(null);
    setStage(`Loading presentation sample: ${name}...`);

    try {
      setTimeout(() => setStage('Executing PyShark / TShark dissections...'), 500);
      setTimeout(() => setStage('Evaluating threat detection heuristics...'), 1200);

      const capture = await api.loadDemoCapture(demoId);
      setIsProcessing(false);
      onUploadSuccess(capture);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Failed to load demo capture.');
    }
  };

  const demoPresets = [
    {
      id: 'port_scan' as const,
      title: 'Demo 1: Recon & Port Scan',
      desc: 'Nmap SYN scan targeting 35 distinct ports. Triggers Port Scan & Connection Burst rules.',
      icon: Crosshair,
      badge: 'High Suspicion',
      badgeColor: darkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'web_traffic' as const,
      title: 'Demo 2: Web Application Traffic',
      desc: 'Plaintext HTTP requests, APIs, assets, and DNS queries. Triggers unencrypted protocol rule.',
      icon: Globe,
      badge: 'Low Risk',
      badgeColor: darkMode ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'multi_threat' as const,
      title: 'Demo 3: Multi-Threat Incident',
      desc: 'ICMP flood, long DNS exfiltration tunnel, C2 ports 4444 & 31337, and SYN flood attempts.',
      icon: ShieldAlert,
      badge: 'Critical Incident',
      badgeColor: darkMode ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`rounded-2xl max-w-xl w-full p-6 shadow-2xl border relative max-h-[90vh] overflow-y-auto transition-colors ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            darkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Upload Network Capture</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload your own PCAP file or select a pre-configured presentation scenario
              </p>
            </div>
          </div>
        </div>

        {/* Presentation Sample PCAPs Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Presentation Demo Scenarios
            </span>
            <span className="text-[10px] text-slate-400">1-click instant analysis</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {demoPresets.map((demo) => {
              const Icon = demo.icon;
              return (
                <div
                  key={demo.id}
                  onClick={() => !isProcessing && handleLoadDemo(demo.id, demo.title)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                    darkMode
                      ? 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-sky-500/50'
                      : 'bg-slate-50 border-slate-200 hover:bg-sky-50/50 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{demo.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${demo.badgeColor}`}>
                          {demo.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{demo.desc}</p>
                    </div>
                  </div>

                  <button
                    disabled={isProcessing}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-sky-400 group-hover:text-sky-300 px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag & Drop Area for custom PCAP */}
        <div className="relative mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Or Upload Custom PCAP / PCAPNG
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-500/10'
                : file
                ? 'border-emerald-500 bg-emerald-500/10'
                : darkMode
                ? 'border-slate-700 bg-slate-800/40 hover:border-sky-500/50 hover:bg-slate-800/70'
                : 'border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pcap,.pcapng"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold font-mono">{file.name}</div>
                <div className="text-[11px] text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB • Ready for deep analysis
                </div>
                <span className="text-[11px] text-sky-400 underline mt-0.5">Change selected file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold">
                  Click or drag capture file here
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports Wireshark .pcap &amp; .pcapng files (Up to 50 MB)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Upload Error:</span> {error}
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mb-4 p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
              <div className="text-xs font-medium text-sky-200">{stage}</div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400">
            Sample data available in <code className="text-sky-400">sample_data/</code>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className={`px-3.5 py-2 rounded-lg font-medium transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || isProcessing}
              className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dissecting...</span>
                </>
              ) : (
                <span>Analyze Custom File</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
