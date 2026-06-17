import { RefreshCw, CheckSquare, MessageSquare, TrendingUp, Globe, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import { useUserStore } from '@/store/userStore';
import { getInitials } from '@/utils/format';
import type { TimelineEvent, User } from '@/types';

interface EventTimelineProps {
  events: TimelineEvent[];
  users?: User[];
  className?: string;
}

const TYPE_ICONS: Record<TimelineEvent['type'], typeof RefreshCw> = {
  status_change: RefreshCw,
  task: CheckSquare,
  communication: MessageSquare,
  sentiment_update: TrendingUp,
  external: Globe,
  note: FileText,
};

const TYPE_COLORS: Record<TimelineEvent['type'], { bg: string; icon: string; dot: string }> = {
  status_change: { bg: 'bg-blue-50', icon: 'text-blue-600', dot: 'bg-blue-500' },
  task: { bg: 'bg-green-50', icon: 'text-green-600', dot: 'bg-green-500' },
  communication: { bg: 'bg-purple-50', icon: 'text-purple-600', dot: 'bg-purple-500' },
  sentiment_update: { bg: 'bg-orange-50', icon: 'text-orange-600', dot: 'bg-orange-500' },
  external: { bg: 'bg-cyan-50', icon: 'text-cyan-600', dot: 'bg-cyan-500' },
  note: { bg: 'bg-gray-50', icon: 'text-gray-600', dot: 'bg-gray-500' },
};

interface TimelineItemProps {
  event: TimelineEvent;
  getUserById: (id: string) => User | undefined;
  isLast: boolean;
}

function TimelineItem({ event, getUserById, isLast }: TimelineItemProps) {
  const Icon = TYPE_ICONS[event.type];
  const colors = TYPE_COLORS[event.type];
  const user = getUserById(event.createdBy);

  return (
    <div className="relative flex gap-4 group">
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            'relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-110',
            colors.bg,
            colors.dot
          )}
        >
          <Icon className={cn('h-4 w-4 text-white')} />
        </div>
        {!isLast && (
          <div className="absolute top-9 h-full w-0.5 -translate-x-1/2 left-1/2 bg-gray-200" />
        )}
      </div>

      <div className={cn('flex-1 pb-8', !isLast && '')}>
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 group-hover:shadow-md">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', colors.bg, colors.icon)}>
              <Icon className="mr-1 h-3 w-3" />
              {event.type === 'status_change' && '状态变更'}
              {event.type === 'task' && '任务'}
              {event.type === 'communication' && '沟通记录'}
              {event.type === 'sentiment_update' && '舆情更新'}
              {event.type === 'external' && '外部事件'}
              {event.type === 'note' && '备注'}
            </span>
            <span className="text-xs text-gray-400">{formatDateTime(event.timestamp)}</span>
          </div>

          <h4 className="mb-1.5 text-sm font-semibold text-gray-900">{event.title}</h4>
          {event.description && (
            <p className="mb-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          {user && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                  {getInitials(user.name)}
                </div>
              )}
              <span>操作人：{user.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventTimeline({ events, className }: EventTimelineProps) {
  const { getUserById } = useUserStore();

  if (events.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-sm text-gray-500">暂无时间线记录</p>
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={cn('relative pl-2', className)}>
      {sorted.map((ev, idx) => (
        <TimelineItem
          key={ev.id}
          event={ev}
          getUserById={getUserById}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </div>
  );
}
