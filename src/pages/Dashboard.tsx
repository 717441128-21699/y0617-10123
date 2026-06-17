import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  FileCheck,
  CheckCircle,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import PageContainer from '@/components/layout/PageContainer';
import StatCard from '@/components/common/StatCard';
import EventStatusBadge from '@/components/events/EventStatusBadge';
import SeverityIndicator from '@/components/events/SeverityIndicator';
import PriorityBadge from '@/components/tasks/PriorityBadge';
import { useEventStore } from '@/store/eventStore';
import { useTaskStore } from '@/store/taskStore';
import { useDocStore } from '@/store/docStore';
import { useUserStore } from '@/store/userStore';
import { formatDate, isOverdue } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Task, CrisisEvent, TaskPriority } from '@/types';

const SEVERITY_COLORS = ['#22c55e', '#16a34a', '#eab308', '#f97316', '#ef4444'];
const CHART_COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
};

const PRIORITY_SORT: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function SkeletonStatCard() {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-20 bg-slate-200 rounded animate-pulse" />
        <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return <div className="card p-5 h-[320px] bg-slate-100 animate-pulse rounded-xl" />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, currentUserId, initUsers } = useUserStore();
  const { events, activeEvents, highRiskEvents, monthlyTrendData, initEvents } = useEventStore();
  const { tasks, pendingTasksCount, initTasks } = useTaskStore();
  const { pendingApprovalsCount, initDocs } = useDocStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUsers();
    initEvents();
    initTasks();
    initDocs();
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [initUsers, initEvents, initTasks, initDocs]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  const resolvedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return events.filter((e) => {
      if (e.status !== 'resolved' && e.status !== 'archived') return false;
      const t = new Date(e.resolvedAt || e.archivedAt || '').getTime();
      return t >= monthStart;
    }).length;
  }, [events]);

  const activeTrend = useMemo(() => {
    if (monthlyTrendData.length < 2) return 0;
    const last = monthlyTrendData[monthlyTrendData.length - 1].count;
    const prev = monthlyTrendData[monthlyTrendData.length - 2].count || 1;
    return Math.round(((last - prev) / prev) * 100);
  }, [monthlyTrendData]);

  const severityData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    activeEvents.forEach((e) => {
      counts[e.severity - 1]++;
    });
    return [
      { name: '1级-轻微', value: counts[0] },
      { name: '2级-一般', value: counts[1] },
      { name: '3级-中等', value: counts[2] },
      { name: '4级-严重', value: counts[3] },
      { name: '5级-特别重大', value: counts[4] },
    ].filter((d) => d.value > 0);
  }, [activeEvents]);

  const totalSeverity = severityData.reduce((s, d) => s + d.value, 0);

  const trendChartData = useMemo(() => {
    return monthlyTrendData.map((d) => ({
      ...d,
      monthLabel: d.month.slice(5),
      resolved: Math.max(0, Math.floor(d.count * (0.5 + Math.random() * 0.3))),
    }));
  }, [monthlyTrendData]);

  const myPendingTasks = useMemo(() => {
    if (!currentUserId) return [];
    return tasks
      .filter(
        (t) =>
          t.assigneeId === currentUserId &&
          (t.status === 'todo' || t.status === 'in_progress' || t.status === 'review')
      )
      .sort((a, b) => {
        const pa = PRIORITY_SORT[a.priority];
        const pb = PRIORITY_SORT[b.priority];
        if (pa !== pb) return pa - pb;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 5);
  }, [tasks, currentUserId]);

  const topHighRiskEvents = useMemo(() => {
    return [...highRiskEvents]
      .sort((a, b) => {
        if (a.severity !== b.severity) return b.severity - a.severity;
        return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
      })
      .slice(0, 5);
  }, [highRiskEvents]);

  const getEventById = (id: string) => events.find((e) => e.id === id);

  const handleTaskClick = () => navigate('/tasks');
  const handleEventClick = (id: string) => navigate(`/events/${id}`);

  return (
    <PageContainer title="仪表盘" subtitle="危机事件管理工作台">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-slate-800">
          {greeting}，{currentUser?.name || '用户'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          今天是 {formatDate(new Date().toISOString())}，以下是您的工作概览
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              icon={<LayoutDashboard className="w-6 h-6" />}
              title="活跃事件数"
              value={activeEvents.length}
              trend={activeTrend}
              trendLabel="对比上月"
              color="blue"
            />
            <StatCard
              icon={<ListTodo className="w-6 h-6" />}
              title="待处理任务"
              value={pendingTasksCount(currentUserId)}
              color="amber"
            />
            <StatCard
              icon={<FileCheck className="w-6 h-6" />}
              title="待审批文档"
              value={pendingApprovalsCount}
              color="red"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="本月已平息"
              value={resolvedThisMonth}
              color="green"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-8">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-slate-800">事件趋势</h3>
                <span className="text-xs text-slate-400">过去6个月</span>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="新增事件"
                      stroke={CHART_COLORS.blue}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                    <Bar
                      dataKey="resolved"
                      name="已解决"
                      fill={CHART_COLORS.green}
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-slate-800">严重程度分布</h3>
                <span className="text-xs text-slate-400">活跃事件</span>
              </div>
              <div className="h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData.length > 0 ? severityData : [{ name: '暂无', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {severityData.length > 0
                        ? severityData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % 5]} />
                          ))
                        : <Cell fill="#e2e8f0" />}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-serif font-bold text-slate-800">{totalSeverity}</span>
                  <span className="text-xs text-slate-400">事件总数</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {severityData.map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[idx] }} />
                    <span className="text-slate-600">{d.name} {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-slate-800">我的待办任务</h3>
              <button
                onClick={handleTaskClick}
                className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
              >
                查看全部 →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : myPendingTasks.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                暂无待办任务，真棒！
              </div>
            ) : (
              <div className="space-y-2">
                {myPendingTasks.map((task: Task) => {
                  const event = getEventById(task.eventId);
                  const overdue = isOverdue(task.deadline);
                  return (
                    <div
                      key={task.id}
                      onClick={handleTaskClick}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                    >
                      <PriorityBadge priority={task.priority} showIcon />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {event ? `事件: ${event.title}` : '未关联事件'}
                        </p>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 text-xs flex-shrink-0',
                        overdue ? 'text-red-500 font-medium' : 'text-slate-400'
                      )}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-orange-500" />
                高风险事件
              </h3>
              <button
                onClick={() => navigate('/events')}
                className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
              >
                全部 →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topHighRiskEvents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                暂无高风险事件
              </div>
            ) : (
              <div className="space-y-2">
                {topHighRiskEvents.map((event: CrisisEvent) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <SeverityIndicator level={event.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate line-clamp-2">{event.title}</p>
                      <div className="mt-1.5">
                        <EventStatusBadge status={event.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
