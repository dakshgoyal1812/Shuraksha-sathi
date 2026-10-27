import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description: string;
  trend?: string;
  status?: 'normal' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  description,
  trend,
  status = 'normal',
}) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'success':
        return 'text-[#059669] border-emerald-200 bg-[#ECFDF5]';
      case 'warning':
        return 'text-amber-700 border-amber-200 bg-amber-50';
      case 'danger':
        return 'text-[#DC2626] border-rose-200 bg-[#FFF1F2]';
      default:
        return 'text-slate-700 border-slate-200 bg-slate-100';
    }
  };

  return (
    <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 shadow-xs hover:border-slate-300 transition group">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-semibold text-[#64748B]">
          {label}
        </span>
        <div className={`p-1.5 rounded-lg border ${getStatusClasses()}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-[28px] font-bold tracking-tight text-[#0F172A]">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-[#94A3B8]">{unit}</span>}
      </div>

      <p className="text-[11px] text-[#94A3B8] leading-relaxed">{description}</p>

      {trend && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
};
