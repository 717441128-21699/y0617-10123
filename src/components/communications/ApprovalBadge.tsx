import { Check, Clock, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalStatus } from '@/types';

interface ApprovalBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

const configs: Record<ApprovalStatus, { label: string; icon: React.ReactNode; className: string }> = {
  approved: {
    label: '已通过',
    icon: <Check className="w-3.5 h-3.5" />,
    className: 'bg-green-50 text-green-700 border-green-100',
  },
  pending: {
    label: '待审批',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  },
  rejected: {
    label: '已驳回',
    icon: <X className="w-3.5 h-3.5" />,
    className: 'bg-red-50 text-red-700 border-red-100',
  },
  draft: {
    label: '草稿',
    icon: <File className="w-3.5 h-3.5" />,
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
};

export default function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
  const config = configs[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
