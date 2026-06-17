import { Flame, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPriorityConfig } from '@/utils/status';
import type { TaskPriority } from '@/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  showIcon?: boolean;
  className?: string;
}

const PRIORITY_ICONS: Record<TaskPriority, typeof Flame> = {
  urgent: Flame,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
};

export default function PriorityBadge({ priority, showIcon, className }: PriorityBadgeProps) {
  const config = getPriorityConfig(priority);
  const Icon = PRIORITY_ICONS[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
