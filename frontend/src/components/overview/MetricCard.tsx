import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  icon?: React.ReactNode;
  value: string | number;
  subValue?: string;
  subLabel?: string;
  secondaryInfo?: { label: string; value: string | number }[];
  onClick?: () => void;
  darkMode?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  icon,
  value,
  subValue,
  subLabel,
  secondaryInfo,
  onClick,
  darkMode = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 border shadow-card transition-all duration-200 flex flex-col justify-between ${
        darkMode
          ? 'bg-slate-900 border-slate-800/90 text-slate-100 hover:border-slate-700'
          : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div>
        {/* Header with Arrow */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon}
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
              {label}
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400 transition-colors shrink-0" />
        </div>

        {/* Primary Value */}
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-white">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-slate-400 ml-1.5 font-sans font-medium">
              {subValue}
            </span>
          )}
        </div>

        {subLabel && (
          <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-1">
            {subLabel}
          </p>
        )}
      </div>

      {/* Secondary Information row */}
      {secondaryInfo && secondaryInfo.length > 0 && (
        <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-[11px]">
          {secondaryInfo.map((item, idx) => (
            <div key={idx}>
              <span className="text-slate-500 text-[9px] uppercase font-bold block">
                {item.label}
              </span>
              <span className="font-semibold font-mono text-slate-300 text-xs">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
