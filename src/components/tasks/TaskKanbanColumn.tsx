import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskCard from './TaskCard';
import { getTaskStatusConfig } from '@/utils/status';
import type { Task, TaskStatus, CrisisEvent, User } from '@/types';

interface TaskKanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  users: User[];
  events?: CrisisEvent[];
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

const STATUS_HEADER_COLORS: Record<TaskStatus, string> = {
  todo: 'border-gray-400',
  in_progress: 'border-blue-500',
  review: 'border-purple-500',
  completed: 'border-green-500',
  cancelled: 'border-slate-400',
};

export default function TaskKanbanColumn({
  title,
  status,
  tasks,
  users,
  events = [],
  onAddTask,
  onTaskClick,
  className,
}: TaskKanbanColumnProps) {
  const config = getTaskStatusConfig(status);
  const headerBorder = STATUS_HEADER_COLORS[status];

  const getEventById = (id: string) => events.find((e) => e.id === id);

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border border-gray-200 bg-gray-50/50',
        className
      )}
    >
      <div className={cn('border-t-4 rounded-t-xl', headerBorder)}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <span
              className={cn(
                'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium',
                config.bgColor,
                config.textColor
              )}
            >
              {tasks.length}
            </span>
          </div>
          {onAddTask && (
            <button
              type="button"
              onClick={onAddTask}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="添加任务"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400 mb-2">暂无任务</p>
            {onAddTask && (
              <button
                type="button"
                onClick={onAddTask}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                添加任务
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              event={getEventById(task.eventId)}
              users={users}
              onClick={onTaskClick ? () => onTaskClick(task) : undefined}
            />
          ))
        )}
      </div>

      {onAddTask && tasks.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-white/40">
          <button
            type="button"
            onClick={onAddTask}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            添加任务
          </button>
        </div>
      )}
    </div>
  );
}
