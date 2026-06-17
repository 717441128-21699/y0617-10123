import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardColor = 'primary' | 'blue' | 'green' | 'amber' | 'red' | 'cyan';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  color?: StatCardColor;
  className?: string;
}

const colorGradients: Record<StatCardColor, string> = {
  primary: 'from-primary-500 to-primary-700',
  blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  red: 'from-red-500 to-red-700',
  cyan: 'from-cyan-500 to-cyan-700',
};

const colorBgSoft: Record<StatCardColor, string> = {
  primary: 'bg-primary-50',
  blue: 'bg-blue-50',
  green: 'bg-emerald-50',
  amber: 'bg-amber-50',
  red: 'bg-red-50',
  cyan: 'bg-cyan-50',
};

export default function StatCard({
  icon,
  title,
  value,
  trend,
  trendLabel,
  color = 'primary',
  className,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        'card card-hover p-5 flex items-center gap-4',
        className
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-md',
          colorGradients[color]
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 mb-0.5">{title}</p>
        <p className="text-2xl font-serif font-bold text-slate-800">{value}</p>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 text-xs font-medium',
              isPositive ? 'text-success-600' : 'text-danger-600'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(trend)}%</span>
            {trendLabel && (
              <span className="text-slate-400 font-normal ml-0.5">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
      {colorBgSoft[color] && null}
    </div>
  );
}
