import { cn } from '@/lib/utils';
import { getTaskStatusConfig } from '@/utils/status';
import type { TaskStatus } from '@/types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export default function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = getTaskStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  );
}
