import React from 'react';
import { Database, FileCode2, FileSpreadsheet, Braces, Download, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Capture } from '../../types';

interface ExportPanelProps {
  currentCapture: Capture | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ currentCapture }) => {
  if (!currentCapture) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-card">
        <p className="text-slate-500 text-sm">Please select or upload a capture to access exports.</p>
      </div>
    );
  }

  const exportFormats = [
    {
      id: 'sqlite',
      format: 'sqlite' as const,
      title: 'Standalone SQLite Database',
      ext: '.sqlite',
      icon: Database,
      description:
        'Download a portable SQLite database with indexed tables for capture metadata, parsed packets, detection alerts, and traffic statistics.',
      badge: 'Prescribed Module',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'xml',
      format: 'xml' as const,
      title: 'Structured PCAP XML',
      ext: '.xml',
      icon: FileCode2,
      description:
        'Hierarchical XML document containing capture metadata, statistical aggregates, detection alerts with structured evidence, and packet lists.',
      badge: 'Prescribed Module',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'csv',
      format: 'csv' as const,
      title: 'Packet Metadata CSV',
      ext: '.csv',
      icon: FileSpreadsheet,
      description:
        'Tabular CSV file formatted for Excel or SIEM ingestion, including IPs, MACs, protocols, ports, timestamps, and application metadata.',
      badge: 'Spreadsheet Format',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'json',
      format: 'json' as const,
      title: 'Intelligence Summary JSON',
      ext: '.json',
      icon: Braces,
      description:
        'JSON intelligence report containing overall capture metrics, heuristic threat scores, and parsed anomaly alerts.',
      badge: 'API Integration',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Exports &amp; Reports</h2>
        <p className="text-xs text-slate-500 mt-1">
          Export analyzed capture results for <strong>{currentCapture.original_filename}</strong> in standard open formats
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportFormats.map((item) => {
          const Icon = item.icon;
          const downloadUrl = api.getExportUrl(currentCapture.id, item.format);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{item.ext}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>
                    {item.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Target: {currentCapture.id.substring(0, 8)}...
                </span>
                <a
                  href={downloadUrl}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {item.ext}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Defensive Privacy Compliance Reminder */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Compliance &amp; Privacy Notice:</strong> All exported artifacts contain only network metadata and transparent heuristic detection results. Raw payloads, authorization cookies, and private credentials are excluded by architectural design.
        </div>
      </div>
    </div>
  );
};
