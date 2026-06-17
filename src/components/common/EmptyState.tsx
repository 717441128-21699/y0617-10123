import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon = <Inbox className="w-12 h-12" />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-serif font-semibold text-slate-700 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
