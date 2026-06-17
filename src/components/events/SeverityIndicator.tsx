import { cn } from '@/lib/utils';
import { getSeverityConfig } from '@/utils/status';
import type { SeverityLevel } from '@/types';

interface SeverityIndicatorProps {
  level: SeverityLevel;
  showLabel?: boolean;
  className?: string;
}

const LEVEL_COLORS = [
  'bg-green-400',
  'bg-green-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
];

export default function SeverityIndicator({ level, showLabel, className }: SeverityIndicatorProps) {
  const config = getSeverityConfig(level);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-3 w-2 rounded-sm transition-colors',
              i <= level ? LEVEL_COLORS[i - 1] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', config.textColor)}>{config.label}</span>
      )}
    </div>
  );
}
