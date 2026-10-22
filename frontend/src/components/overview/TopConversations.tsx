import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TopConversation } from '../../types';

interface TopConversationsProps {
  conversations: TopConversation[];
}

export const TopConversations: React.FC<TopConversationsProps> = ({ conversations }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">Top Conversations</h3>
          <p className="text-[11px] text-slate-500">Most active bidirectional host pairings</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {conversations.slice(0, 5).map((conv, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 text-xs hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-800 font-semibold">{conv.source_ip}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 font-semibold">{conv.dest_ip}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200/80">
                {conv.protocol}
              </span>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-800 font-bold">{conv.packet_count} pkts</span>
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
