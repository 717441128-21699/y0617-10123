import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import PriorityBadge from './PriorityBadge';
import TaskStatusBadge from './TaskStatusBadge';
import { formatRelative, isOverdue, formatDate } from '@/utils/date';
import { getInitials } from '@/utils/format';
import type { Task, CrisisEvent, User as UserType } from '@/types';

interface TaskCardProps {
  task: Task;
  event?: CrisisEvent;
  users: UserType[];
  onClick?: () => void;
  className?: string;
}

export default function TaskCard({ task, event, users, onClick, className }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const overdue = isOverdue(task.deadline) && task.status !== 'completed' && task.status !== 'cancelled';

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else {
      setExpanded(!expanded);
    }
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} showIcon />
        <TaskStatusBadge status={task.status} />
        <div
          className={cn(
            'ml-auto flex items-center gap-1 text-xs',
            overdue ? 'text-red-500 font-medium' : 'text-gray-500'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>{overdue ? '已过期 ' : ''}{formatDate(task.deadline)}</span>
        </div>
      </div>

      <h4 className="mb-1.5 text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      {event && (
        <p className="mb-3 text-xs text-gray-500 truncate">
          关联事件：{event.title}
        </p>
      )}

      {expanded && task.description && (
        <p className="mb-3 rounded-md bg-gray-50 p-2.5 text-xs text-gray-600 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {assignee ? (
            <>
              {assignee.avatar ? (
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                  {getInitials(assignee.name)}
                </div>
              )}
              <span className="text-xs text-gray-600">{assignee.name}</span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3.5 w-3.5" />
              <span>未分配</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatRelative(task.createdAt)}</span>
          {!onClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
