import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Filter,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import TaskKanbanColumn from '@/components/tasks/TaskKanbanColumn';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import PriorityBadge from '@/components/tasks/PriorityBadge';
import TaskStatusBadge from '@/components/tasks/TaskStatusBadge';
import EventStatusBadge from '@/components/events/EventStatusBadge';
import { useTaskStore } from '@/store/taskStore';
import { useEventStore } from '@/store/eventStore';
import { useUserStore } from '@/store/userStore';
import { formatDateTime, formatDate, isOverdue, formatRelative } from '@/utils/date';
import { getInitials } from '@/utils/format';
import { getPriorityConfig, getTaskTypeConfig } from '@/utils/status';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority, TaskType } from '@/types';

const TASK_STATUS_LIST: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  review: '审核中',
  completed: '已完成',
  cancelled: '已取消',
};

type FilterScope = 'all' | 'mine' | 'completed' | 'overdue';

const SCOPE_OPTIONS: { key: FilterScope; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'mine', label: '我的待办' },
  { key: 'completed', label: '已完成' },
  { key: 'overdue', label: '已逾期' },
];

const PRIORITY_OPTIONS: (TaskPriority | 'all')[] = ['all', 'urgent', 'high', 'medium', 'low'];
const TYPE_OPTIONS: (TaskType | 'all')[] = ['all', 'legal', 'customer_service', 'pr', 'management', 'other'];

export default function TaskCenter() {
  const navigate = useNavigate();
  const { tasks, addTask, initTasks, updateTaskStatus } = useTaskStore();
  const { events, initEvents } = useEventStore();
  const { users, currentUserId, initUsers, getUserById } = useUserStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<FilterScope>('mine');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  useEffect(() => {
    initUsers();
    initEvents();
    initTasks();
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [initUsers, initEvents, initTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (scope === 'mine' && t.assigneeId !== currentUserId) return false;
      if (scope === 'completed' && t.status !== 'completed') return false;
      if (scope === 'overdue' && !isOverdue(t.deadline)) return false;
      if (scope === 'overdue' && (t.status === 'completed' || t.status === 'cancelled')) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search) {
        const kw = search.toLowerCase();
        if (!t.title.toLowerCase().includes(kw) && !t.description.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [tasks, scope, priorityFilter, typeFilter, search, currentUserId]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [], in_progress: [], review: [], completed: [], cancelled: [],
    };
    filteredTasks.forEach((t) => map[t.status].push(t));
    return map;
  }, [filteredTasks]);

  const handleCreateTask = (data: Partial<Task>) => {
    addTask(data);
    setShowCreateModal(false);
  };

  const getNextStatus = (status: TaskStatus): TaskStatus => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed'];
    const idx = order.indexOf(status);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : status;
  };

  const getEventById = (id: string) => events.find((e) => e.id === id);

  const hasActiveFilters = scope !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || search;

  const clearFilters = () => {
    setScope('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setSearch('');
  };

  const renderKanbanView = () => {
    if (filteredTasks.length === 0) {
      return (
        <EmptyState
          title="暂无任务"
          description={hasActiveFilters ? '没有符合筛选条件的任务' : '点击右上角"新建任务"按钮创建第一个任务'}
          action={
            !hasActiveFilters && (
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                新建任务
              </Button>
            )
          }
        />
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" style={{ minHeight: 500 }}>
        {TASK_STATUS_LIST.map((status) => (
          <TaskKanbanColumn
            key={status}
            title={TASK_STATUS_LABELS[status]}
            status={status}
            tasks={tasksByStatus[status]}
            users={users}
            events={events}
            onAddTask={() => setShowCreateModal(true)}
            onTaskClick={(task) => updateTaskStatus(task.id, getNextStatus(task.status))}
          />
        ))}
      </div>
    );
  };

  const renderListView = () => {
    if (filteredTasks.length === 0) {
      return (
        <EmptyState
          title="暂无任务"
          description={hasActiveFilters ? '没有符合筛选条件的任务' : '点击右上角"新建任务"按钮创建第一个任务'}
        />
      );
    }

    return (
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">优先级</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">状态</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap min-w-[260px]">任务标题</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">类型</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">所属事件</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">负责人</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">截止时间</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const event = getEventById(task.eventId);
                const assignee = getUserById(task.assigneeId);
                const overdue = isOverdue(task.deadline) && task.status !== 'completed' && task.status !== 'cancelled';
                const expanded = expandedTaskId === task.id;
                const typeCfg = getTaskTypeConfig(task.type);
                return (
                  <>
                    <tr
                      key={task.id}
                      onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} showIcon />
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-4 h-4 flex items-center justify-center text-slate-400', expanded && 'rotate-90 transition-transform')}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                          <div className="font-medium text-slate-800 line-clamp-1">{task.title}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 text-xs flex items-center gap-1">
                          <span>{typeCfg.icon}</span>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {event ? (
                          <span
                            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
                            className="text-primary-600 hover:text-primary-700 hover:underline text-xs cursor-pointer inline-flex items-center gap-1 max-w-[160px] truncate"
                            title={event.title}
                          >
                            {event.title}
                            <EventStatusBadge status={event.status} />
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">未关联</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            {assignee.avatar ? (
                              <img src={assignee.avatar} alt={assignee.name} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                                {getInitials(assignee.name)}
                              </div>
                            )}
                            <span className="text-xs text-slate-700">{assignee.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            <span>未分配</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'flex items-center gap-1 text-xs whitespace-nowrap',
                          overdue ? 'text-red-500 font-medium' : 'text-slate-500'
                        )}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span title={formatDateTime(task.deadline)}>
                            {overdue ? '已逾期 ' : ''}{formatDate(task.deadline)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400 whitespace-nowrap" title={formatDateTime(task.createdAt)}>
                          {formatRelative(task.createdAt)}
                        </span>
                      </td>
                    </tr>
                    {expanded && task.description && (
                      <tr>
                        <td colSpan={8} className="px-10 py-4 bg-slate-50/60">
                          <div className="flex gap-3">
                            <div className="w-0.5 bg-primary-200 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-400 mb-1.5">任务描述</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {task.description}
                              </p>
                              {task.comments && task.comments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                  <p className="text-xs text-slate-400 mb-2">评论 ({task.comments.length})</p>
                                  <div className="space-y-2">
                                    {task.comments.map((c) => {
                                      const cu = getUserById(c.userId);
                                      return (
                                        <div key={c.id} className="flex gap-2 text-xs">
                                          {cu?.avatar ? (
                                            <img src={cu.avatar} alt={cu.name} className="h-5 w-5 rounded-full object-cover flex-shrink-0" />
                                          ) : (
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600 flex-shrink-0">
                                              {getInitials(cu?.name || 'U')}
                                            </div>
                                          )}
                                          <div className="flex-1 bg-white rounded-lg p-2.5 border border-slate-100">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-slate-700">{cu?.name || '未知用户'}</span>
                                              <span className="text-slate-400">{formatRelative(c.createdAt)}</span>
                                            </div>
                                            <p className="text-slate-600">{c.content}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title="任务中心"
      subtitle={`共 ${tasks.length} 个任务，${filteredTasks.length} 个匹配筛选条件`}
      actions={
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          新建任务
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setScope(opt.key)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-medium transition-all',
                    scope === opt.key
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索任务标题或描述..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? '全部优先级' : getPriorityConfig(p).label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TaskType | 'all')}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? '全部类型' : getTaskTypeConfig(t).label}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
                title="看板视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> 当前筛选：
              </span>
              {scope !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  {SCOPE_OPTIONS.find((o) => o.key === scope)?.label}
                  <button onClick={() => setScope('all')} className="rounded-full p-0.5 hover:bg-slate-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {priorityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  优先级: {getPriorityConfig(priorityFilter).label}
                  <button onClick={() => setPriorityFilter('all')} className="rounded-full p-0.5 hover:bg-slate-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  类型: {getTaskTypeConfig(typeFilter).label}
                  <button onClick={() => setTypeFilter('all')} className="rounded-full p-0.5 hover:bg-slate-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  搜索: {search}
                  <button onClick={() => setSearch('')} className="rounded-full p-0.5 hover:bg-slate-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button onClick={clearFilters} className="ml-2 text-primary-600 hover:text-primary-700 hover:underline font-medium">
                清除全部
              </button>
            </div>
          )}
        </div>

        {loading ? (
          viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {TASK_STATUS_LIST.map((s) => (
                <div key={s} className="card h-80 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="space-y-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 border-b border-slate-100 bg-slate-50 animate-pulse" />
                ))}
              </div>
            </div>
          )
        ) : (
          viewMode === 'kanban' ? renderKanbanView() : renderListView()
        )}
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建任务"
        maxWidth="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </PageContainer>
  );
}
