import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Packet, PacketListResponse } from '../../types';

interface PacketExplorerProps {
  captureId: string;
}

export const PacketExplorer: React.FC<PacketExplorerProps> = ({ captureId }) => {
  const [data, setData] = useState<PacketListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [protocol, setProtocol] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  const fetchPackets = async () => {
    if (!captureId) return;
    setLoading(true);
    try {
      const res = await api.getPackets(captureId, {
        page,
        page_size: 50,
        protocol: protocol || undefined,
        search: search || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load packets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackets();
  }, [captureId, page, protocol]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPackets();
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IP, MAC, port, DNS query, HTTP host..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
            />
          </form>

          {/* Protocol filter */}
          <div className="relative">
            <select
              value={protocol}
              onChange={(e) => {
                setProtocol(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 pr-7 font-medium focus:outline-none cursor-pointer appearance-none"
            >
              <option value="">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="DNS">DNS</option>
              <option value="HTTP">HTTP</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Refresh / Results count */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-mono">
            {data ? `${data.total.toLocaleString()} total packets` : 'Loading...'}
          </span>
          <button
            onClick={fetchPackets}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Packet Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3">No.</th>
                <th className="py-2.5 px-3">Time (+s)</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Proto</th>
                <th className="py-2.5 px-3">Length</th>
                <th className="py-2.5 px-3">Info Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Loading packet records...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    No packets matched the current filters.
                  </td>
                </tr>
              ) : (
                data.items.map((pkt) => (
                  <tr
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    className="hover:bg-sky-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400 text-[11px] font-bold">
                      {pkt.packet_number}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {pkt.relative_time.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-medium">
                      {pkt.source_ip || pkt.source_mac || '—'}
                      {pkt.source_port ? <span className="text-slate-400">:{pkt.source_port}</span> : ''}
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-medium">
                      {pkt.dest_ip || pkt.dest_mac || '—'}
                      {pkt.dest_port ? <span className="text-slate-400">:{pkt.dest_port}</span> : ''}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {pkt.transport_protocol}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {pkt.packet_length} B
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-xs font-sans">
                      {pkt.summary_info || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.pages > 1 && (
          <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page <strong className="text-slate-800">{page}</strong> of{' '}
              <strong className="text-slate-800">{data.pages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Packet Inspection Drawer */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPacket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">
                PACKET #{selectedPacket.packet_number}
              </span>
              <h3 className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {selectedPacket.transport_protocol} • {selectedPacket.packet_length} Bytes
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Captured: {selectedPacket.timestamp} (Offset: +{selectedPacket.relative_time.toFixed(4)}s)
              </p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Ethernet Layer */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1.5">
                  Ethernet II Layer
                </div>
                <div>Src MAC: <strong className="text-slate-800">{selectedPacket.source_mac || 'Unknown'}</strong></div>
                <div>Dst MAC: <strong className="text-slate-800">{selectedPacket.dest_mac || 'Unknown'}</strong></div>
              </div>

              {/* IP Layer */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1.5">
                  Internet Protocol (IPv{selectedPacket.ip_version || '4'})
                </div>
                <div>Source IP: <strong className="text-slate-800">{selectedPacket.source_ip || 'None'}</strong></div>
                <div>Destination IP: <strong className="text-slate-800">{selectedPacket.dest_ip || 'None'}</strong></div>
              </div>

              {/* Transport Layer */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1.5">
                  Transport Layer ({selectedPacket.transport_protocol})
                </div>
                <div>Source Port: <strong className="text-slate-800">{selectedPacket.source_port || '—'}</strong></div>
                <div>Destination Port: <strong className="text-slate-800">{selectedPacket.dest_port || '—'}</strong></div>
                {selectedPacket.tcp_flags && (
                  <div>TCP Flags: <strong className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{selectedPacket.tcp_flags}</strong></div>
                )}
                {selectedPacket.icmp_type !== null && selectedPacket.icmp_type !== undefined && (
                  <div>ICMP Type: <strong className="text-slate-800">{selectedPacket.icmp_type}</strong></div>
                )}
              </div>

              {/* Application Layer Metadata */}
              {(selectedPacket.dns_query_name || selectedPacket.http_method) && (
                <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-200 text-sky-900">
                  <div className="text-[10px] font-bold text-sky-600 uppercase font-sans mb-1.5">
                    Decoded Application Metadata
                  </div>
                  {selectedPacket.dns_query_name && (
                    <div>DNS Query: <strong className="text-sky-950 font-bold">{selectedPacket.dns_query_name}</strong></div>
                  )}
                  {selectedPacket.http_method && (
                    <>
                      <div>HTTP Method: <strong>{selectedPacket.http_method}</strong></div>
                      <div>HTTP Host: <strong>{selectedPacket.http_host}</strong></div>
                      <div>HTTP URI: <strong>{selectedPacket.http_uri}</strong></div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
