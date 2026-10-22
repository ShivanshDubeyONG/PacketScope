import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TopConversation } from '../../types';

interface TopConversationsProps {
  conversations: TopConversation[];
  darkMode?: boolean;
}

export const TopConversations: React.FC<TopConversationsProps> = ({
  conversations,
  darkMode = true,
}) => {
  return (
    <div
      className={`rounded-xl p-5 border shadow-card transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm tracking-tight">Top Network Conversations</h3>
          <p className="text-[11px] text-slate-400">Most active bidirectional host pairings</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {conversations.slice(0, 5).map((conv, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
              darkMode
                ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                : 'bg-slate-50/80 border-slate-200/60 hover:bg-slate-100/60'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {conv.source_ip}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {conv.dest_ip}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  darkMode
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                    : 'bg-sky-100 text-sky-800 border-sky-200/80'
                }`}
              >
                {conv.protocol}
              </span>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {conv.packet_count} pkts
              </span>
              <span className="text-slate-400 text-[10px] ml-1.5">
                ({(conv.byte_count / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
