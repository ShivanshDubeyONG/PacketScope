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
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  icon,
  value,
  subValue,
  subLabel,
  secondaryInfo,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div>
        {/* Header with Arrow */}
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {label}
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

        {/* Primary Value */}
        <div className="my-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-slate-500 ml-1.5 font-sans font-medium">
              {subValue}
            </span>
          )}
        </div>

        {subLabel && (
          <p className="text-xs text-slate-500 font-medium mt-1">
            {subLabel}
          </p>
        )}
      </div>

      {/* Secondary Information row */}
      {secondaryInfo && secondaryInfo.length > 0 && (
        <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px]">
          {secondaryInfo.map((item, idx) => (
            <div key={idx}>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                {item.label}
              </span>
              <span className="font-semibold text-slate-700 font-mono">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
