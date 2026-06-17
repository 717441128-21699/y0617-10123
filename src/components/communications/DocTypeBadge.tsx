import { FileText, MessageCircle, ClipboardList, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/types';

interface DocTypeBadgeProps {
  type: DocumentType;
  className?: string;
}

const configs: Record<DocumentType, { label: string; icon: React.ReactNode; className: string }> = {
  statement: {
    label: '声明',
    icon: <FileText className="w-3.5 h-3.5" />,
    className: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  media_reply: {
    label: '媒体回复',
    icon: <MessageCircle className="w-3.5 h-3.5" />,
    className: 'bg-orange-50 text-orange-700 border-orange-100',
  },
  internal_report: {
    label: '内部汇报',
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    className: 'bg-green-50 text-green-700 border-green-100',
  },
  other: {
    label: '其他',
    icon: <Folder className="w-3.5 h-3.5" />,
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

export default function DocTypeBadge({ type, className }: DocTypeBadgeProps) {
  const config = configs[type];

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
