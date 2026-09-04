import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'info';
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
  badge,
  onClick
}) => {
  const variantStyles = {
    default: {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400',
      text: 'text-slate-900 dark:text-white',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    },
    warning: {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-amber-200 dark:border-amber-900/60',
      iconBg: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
    },
    success: {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-emerald-200 dark:border-emerald-900/60',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    },
    danger: {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-rose-200 dark:border-rose-900/60',
      iconBg: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400',
      text: 'text-rose-700 dark:text-rose-400',
      badge: 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
    },
    info: {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-cyan-200 dark:border-cyan-900/60',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400',
      text: 'text-cyan-700 dark:text-cyan-400',
      badge: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-4 rounded-2xl border ${style.border} ${style.bg} shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:shadow-sm hover:border-teal-300' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-2xl sm:text-3xl font-black tracking-tight ${style.text}`}>
          {value}
        </span>
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.badge}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
