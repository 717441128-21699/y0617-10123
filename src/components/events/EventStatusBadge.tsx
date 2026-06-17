import { cn } from '@/lib/utils';
import { getEventStatusConfig } from '@/utils/status';
import type { EventStatus } from '@/types';

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export default function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const config = getEventStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
