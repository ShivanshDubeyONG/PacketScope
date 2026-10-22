import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle, CheckCircle2, Loader2, FileCode } from 'lucide-react';
import { api } from '../../services/api';
import { Capture } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (capture: Capture) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
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
      setError(`File size exceeds the 50 MB upload limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`);
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
      setTimeout(() => setStage('Executing PyShark / TShark protocol dissections...'), 600);
      setTimeout(() => setStage('Computing traffic aggregates & top talker statistics...'), 1400);
      setTimeout(() => setStage('Evaluating deterministic threat detection heuristics...'), 2200);

      const capture = await api.uploadCapture(file, true);
      setIsProcessing(false);
      onUploadSuccess(capture);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'An error occurred during capture analysis.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Upload Network Capture</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload authorized <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded font-mono">.pcap</code> or{' '}
            <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded font-mono">.pcapng</code> files for deep dissection.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-sky-500 bg-sky-50/60'
              : file
              ? 'border-emerald-400 bg-emerald-50/20'
              : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/20'
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
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-mono">{file.name}</div>
              <div className="text-[11px] text-slate-500">
                {(file.size / 1024).toFixed(1)} KB • Ready for deep analysis
              </div>
              <span className="text-[11px] text-sky-600 underline mt-1">Change file</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Click or drag capture file here
              </div>
              <div className="text-[11px] text-slate-400">
                Supports Wireshark PCAP &amp; PCAPNG (Up to 50 MB)
              </div>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Upload Rejected:</span> {error}
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-4 p-3.5 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
              <div className="text-xs font-medium text-sky-900">{stage}</div>
            </div>
          </div>
        )}

        {/* Defensive Notice */}
        <div className="mt-4 text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-3">
          <strong>Defensive Notice:</strong> PacketScope extracts protocol headers and traffic patterns only. Raw payload contents and credentials are never captured, retained, or leaked.
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || isProcessing}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Dissecting PCAP...</span>
              </>
            ) : (
              <span>Start Analysis</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
