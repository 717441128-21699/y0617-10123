import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import PriorityBadge from './PriorityBadge';
import { getTaskTypeConfig, getPriorityConfig } from '@/utils/status';
import { useUserStore } from '@/store/userStore';
import { useEventStore } from '@/store/eventStore';
import { getInitials } from '@/utils/format';
import type { Task, TaskPriority, TaskType } from '@/types';

interface TaskFormProps {
  eventId?: string;
  initialData?: Partial<Task>;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
  className?: string;
}

const TASK_TYPES: TaskType[] = ['legal', 'customer_service', 'pr', 'management', 'other'];
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

const toLocalInput = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TaskForm({ eventId, initialData, onSubmit, onCancel, className }: TaskFormProps) {
  const { users } = useUserStore();
  const { events } = useEventStore();

  const [title, setTitle] = useState(initialData?.title || '');
  const [taskEventId, setTaskEventId] = useState(initialData?.eventId || eventId || '');
  const [type, setType] = useState<TaskType>((initialData?.type as TaskType) || 'pr');
  const [priority, setPriority] = useState<TaskPriority>((initialData?.priority as TaskPriority) || 'medium');
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || (users[0]?.id ?? ''));
  const [deadline, setDeadline] = useState(toLocalInput(initialData?.deadline));
  const [description, setDescription] = useState(initialData?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (title) setErrors((p) => ({ ...p, title: '' }));
  }, [title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '请输入任务标题';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      eventId: taskEventId,
      type,
      priority,
      assigneeId,
      deadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          任务标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入任务标题"
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2',
            errors.title
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">所属事件</label>
          <select
            value={taskEventId}
            onChange={(e) => setTaskEventId(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          >
            <option value="">不关联事件</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">负责人</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">任务类型</label>
        <div className="grid grid-cols-5 gap-2">
          {TASK_TYPES.map((t) => {
            const config = getTaskTypeConfig(t);
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-all',
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">优先级</label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map((p) => {
            const config = getPriorityConfig(p);
            const active = priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all',
                  active
                    ? cn('border-transparent shadow-sm ring-2 ring-offset-1', config.bgColor, config.textColor)
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                <PriorityBadge priority={p} showIcon />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">截止时间</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">详细描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述任务的具体内容、要求、交付物等"
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {assigneeId && (() => {
          const u = users.find((x) => x.id === assigneeId);
          if (!u) return null;
          return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-400">将指派给：</span>
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                  {getInitials(u.name)}
                </div>
              )}
              <span className="text-gray-700 font-medium">{u.name}</span>
            </div>
          );
        })()}

        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="h-9 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          >
            {initialData?.id ? '保存修改' : '创建任务'}
          </button>
        </div>
      </div>
    </form>
  );
}
