import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Archive,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Clock,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  Radar,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Star,
  Save,
  Send,
  Activity,
  AlertTriangle,
  Flame,
  Globe,
  Download,
  X,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RadarChartComp,
} from 'recharts';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import StatusStepper from '@/components/common/StatusStepper';
import EventStatusBadge from '@/components/events/EventStatusBadge';
import SeverityIndicator from '@/components/events/SeverityIndicator';
import EventTimeline from '@/components/events/EventTimeline';
import TaskKanbanColumn from '@/components/tasks/TaskKanbanColumn';
import TaskForm from '@/components/tasks/TaskForm';
import SentimentForm from '@/components/sentiment/SentimentForm';
import { useEventStore } from '@/store/eventStore';
import { useTaskStore } from '@/store/taskStore';
import { useDocStore } from '@/store/docStore';
import { useKnowledgeStore } from '@/store/knowledgeStore';
import { useUserStore } from '@/store/userStore';
import { formatDateTime, formatRelative, formatDate, daysBetween } from '@/utils/date';
import { formatReach, getInitials, formatNumber } from '@/utils/format';
import {
  getPlatformLabel,
  getEventStatusConfig,
  getSeverityConfig,
  getDocTypeConfig,
  getApprovalStatusConfig,
  getRoleLabel,
} from '@/utils/status';
import { cn } from '@/lib/utils';
import type {
  EventStatus,
  Task,
  TaskStatus,
  CommunicationDoc,
  TimelineEvent,
  ReviewSummary,
  SentimentRecord,
  User,
} from '@/types';

const EVENT_STATUS_STEPS: { key: EventStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'responding', label: '响应中' },
  { key: 'processing', label: '处理中' },
  { key: 'monitoring', label: '监测中' },
  { key: 'resolved', label: '已解决' },
  { key: 'archived', label: '已归档' },
];

const TABS = [
  { key: 'overview', label: '概览', icon: BookOpen },
  { key: 'tasks', label: '任务', icon: CheckCircle2 },
  { key: 'communications', label: '沟通', icon: MessageSquare },
  { key: 'sentiment', label: '舆情', icon: TrendingUpIcon },
  { key: 'timeline', label: '时间线', icon: Clock },
  { key: 'review', label: '复盘', icon: Lightbulb },
] as const;

type TabKey = typeof TABS[number]['key'];

const TASK_STATUS_LIST: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  review: '审核中',
  completed: '已完成',
  cancelled: '已取消',
};

const SENTIMENT_COLORS = {
  negative: '#ef4444',
  neutral: '#94a3b8',
  positive: '#22c55e',
};

export default function EventDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { getEventById, updateEventStatus, initEvents } = useEventStore();
  const { getTasksByEventId, addTask, initTasks, updateTaskStatus } = useTaskStore();
  const { getDocsByEventId, initDocs, addDocVersion, submitForApproval, addApproval } = useDocStore();
  const {
    getSentimentByEventId,
    getTimelineByEventId,
    getReviewByEventId,
    addSentimentRecord,
    addTimelineEvent,
    addReviewSummary,
    cases: knowledgeCases,
    addCase,
    initAll,
  } = useKnowledgeStore();
  const { users, initUsers, getUserById, currentUserId } = useUserStore();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSentimentForm, setShowSentimentForm] = useState(false);
  const [sentimentRange, setSentimentRange] = useState<'24h' | '7d' | 'all'>('all');
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<TimelineEvent['type'] | 'all'>('all');
  const [selectedDoc, setSelectedDoc] = useState<CommunicationDoc | null>(null);
  const [docEditContent, setDocEditContent] = useState('');
  const [docEditChangeLog, setDocEditChangeLog] = useState('');
  const [approvalComment, setApprovalComment] = useState('');

  const event = getEventById(id);
  const tasks = getTasksByEventId(id);
  const docs = getDocsByEventId(id);
  const sentiments = getSentimentByEventId(id);

  const filteredSentiments = useMemo(() => {
    if (sentimentRange === 'all') return sentiments;
    const now = Date.now();
    const cutoff = sentimentRange === '24h'
      ? now - 24 * 60 * 60 * 1000
      : now - 7 * 24 * 60 * 60 * 1000;
    return sentiments.filter((s) => new Date(s.recordedAt).getTime() >= cutoff);
  }, [sentiments, sentimentRange]);

  const sentimentMetrics = useMemo(() => {
    if (filteredSentiments.length === 0) {
      return { totalMentions: 0, negativeRatio: 0, peakReach: 0, peakDate: '', topPlatform: null as null | { label: string; count: number } };
    }
    const totalMentions = filteredSentiments.reduce((sum, s) => sum + s.mentionCount, 0);
    const totalNeg = filteredSentiments.reduce((sum, s) => sum + s.negativeCount, 0);
    const totalPos = filteredSentiments.reduce((sum, s) => sum + s.positiveCount, 0);
    const totalNeu = filteredSentiments.reduce((sum, s) => sum + s.neutralCount, 0);
    const negativeRatio = totalMentions > 0 ? Math.round((totalNeg / totalMentions) * 100) : 0;
    let peakReach = 0;
    let peakDate = '';
    filteredSentiments.forEach((s) => {
      if (s.mentionCount > peakReach) {
        peakReach = s.mentionCount;
        peakDate = s.recordedAt;
      }
    });
    const platformMap = new Map<string, number>();
    filteredSentiments.forEach((s) => {
      (s.platformBreakdown || []).forEach((pb) => {
        const label = getPlatformLabel(pb.platform);
        platformMap.set(label, (platformMap.get(label) || 0) + pb.count);
      });
    });
    const topPlatformArr = Array.from(platformMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    return {
      totalMentions,
      totalNeg,
      totalNeu,
      totalPos,
      negativeRatio,
      peakReach,
      peakDate,
      topPlatform: topPlatformArr[0] || null,
    };
  }, [filteredSentiments]);
  const timeline = getTimelineByEventId(id);
  const review = getReviewByEventId(id);

  const [timelineForm, setTimelineForm] = useState({
    type: 'note' as TimelineEvent['type'],
    title: '',
    description: '',
    timestamp: new Date().toISOString().slice(0, 16),
  });
  const [reviewForm, setReviewForm] = useState({
    strengths: '',
    weaknesses: '',
    rootCause: '',
    suggestions: '',
    responseTime: 3,
    communication: 3,
    execution: 3,
    overallRating: 3,
    lessonsText: '',
  });

  useEffect(() => {
    initUsers();
    initEvents();
    initTasks();
    initDocs();
    initAll();
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [initUsers, initEvents, initTasks, initDocs, initAll]);

  const currentStepIndex = useMemo(() => {
    if (!event) return 0;
    return Math.max(0, EVENT_STATUS_STEPS.findIndex((s) => s.key === event.status));
  }, [event]);

  const assigneeUsers = useMemo(() => {
    if (!event) return [];
    return event.assignees.map((uid) => getUserById(uid)).filter(Boolean) as User[];
  }, [event, getUserById]);

  const handleStatusChange = (newStatus: EventStatus) => {
    if (!event) return;
    updateEventStatus(id, newStatus);
    const cfg = getEventStatusConfig(newStatus);
    addTimelineEvent({
      eventId: id,
      type: 'status_change',
      title: `事件状态变更为「${cfg.label}」`,
      description: `事件从「${getEventStatusConfig(event.status).label}」流转至「${cfg.label}」`,
      createdBy: currentUserId,
    });
  };

  const handleArchive = () => {
    if (!event) return;
    updateEventStatus(id, 'archived');
    addTimelineEvent({
      eventId: id,
      type: 'status_change',
      title: '事件已归档',
      description: '事件已处理完毕，归入知识库',
      createdBy: currentUserId,
    });
  };

  const handleCreateTask = (data: Partial<Task>) => {
    const newTask = addTask({ ...data, eventId: id });
    setShowTaskModal(false);
    const assignee = getUserById(data.assigneeId || '');
    addTimelineEvent({
      eventId: id,
      type: 'task',
      title: `新建任务：${data.title || '未命名任务'}`,
      description: `分配给${assignee?.name || '未指定'}，优先级：${data.priority || '中'}`,
      relatedId: newTask.id,
      createdBy: currentUserId,
    });
  };

  const handleTaskStatusUpdate = (task: Task, newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
    const statusLabels: Record<TaskStatus, string> = {
      todo: '待办', in_progress: '进行中', review: '审核中', completed: '已完成', cancelled: '已取消',
    };
    addTimelineEvent({
      eventId: id,
      type: 'task',
      title: `任务「${task.title}」状态更新`,
      description: `从「${statusLabels[task.status]}」变更为「${statusLabels[newStatus]}」`,
      relatedId: task.id,
      createdBy: currentUserId,
    });
  };

  const handleSentimentSubmit = (record: SentimentRecord) => {
    addTimelineEvent({
      eventId: id,
      type: 'sentiment_update',
      title: `录入舆情数据：提及量 ${formatReach(record.mentionCount)}`,
      description: `负面 ${formatReach(record.negativeCount)}，中性 ${formatReach(record.neutralCount)}，正面 ${formatReach(record.positiveCount)}`,
      relatedId: record.id,
      createdBy: currentUserId,
    });
    setShowSentimentForm(false);
  };

  const handleSaveDocVersion = () => {
    if (!selectedDoc || !docEditContent.trim()) return;
    addDocVersion(selectedDoc.id, docEditContent, docEditChangeLog || '更新内容', currentUserId || 'u001');
    addTimelineEvent({
      eventId: id,
      type: 'communication',
      title: `文档「${selectedDoc.title}」更新新版本`,
      description: docEditChangeLog || '更新内容',
      relatedId: selectedDoc.id,
      createdBy: currentUserId,
    });
    const updatedDoc = useDocStore.getState().getDocById(selectedDoc.id);
    if (updatedDoc) {
      setSelectedDoc(updatedDoc);
    }
    setDocEditChangeLog('');
  };

  const handleSubmitApproval = () => {
    if (!selectedDoc) return;
    const latestVer = selectedDoc.versions[selectedDoc.versions.length - 1]?.version || '1.0';
    submitForApproval(selectedDoc.id, latestVer);
    addTimelineEvent({
      eventId: id,
      type: 'communication',
      title: `文档「${selectedDoc.title}」提交审批`,
      description: `版本 ${latestVer} 已提交审批`,
      relatedId: selectedDoc.id,
      createdBy: currentUserId,
    });
    const updatedDoc = useDocStore.getState().getDocById(selectedDoc.id);
    if (updatedDoc) {
      setSelectedDoc(updatedDoc);
    }
  };

  const handleApprove = (status: 'approved' | 'rejected') => {
    if (!selectedDoc) return;
    const latestVer = selectedDoc.versions[selectedDoc.versions.length - 1]?.version || '1.0';
    addApproval(selectedDoc.id, latestVer, currentUserId || 'u001', status, approvalComment);
    addTimelineEvent({
      eventId: id,
      type: 'communication',
      title: `文档「${selectedDoc.title}」${status === 'approved' ? '审批通过' : '审批驳回'}`,
      description: approvalComment || (status === 'approved' ? '审批通过' : '审批驳回'),
      relatedId: selectedDoc.id,
      createdBy: currentUserId,
    });
    setApprovalComment('');
    const updatedDoc = useDocStore.getState().getDocById(selectedDoc.id);
    if (updatedDoc) {
      setSelectedDoc(updatedDoc);
    }
  };

  const handleSubmitReview = () => {
    const lessons = reviewForm.lessonsText.split('\n').filter(Boolean);
    addReviewSummary({
      ...reviewForm,
      eventId: id,
      lessons,
      completedBy: currentUserId,
    });

    const knowledgeExists = knowledgeCases.some((c) => c.id === `kb_${id}`);
    if (!knowledgeExists && event) {
      addCase({
        id: `kb_${id}`,
        title: event.title,
        category: event.category,
        severity: event.severity,
        startedAt: event.discoveredAt,
        resolvedAt: event.resolvedAt || new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        description: event.cause,
        summary: `${reviewForm.strengths.slice(0, 80)}...`,
        stakeholders: event.assignees,
        reviewSummary: {
          strengths: reviewForm.strengths.split('\n').filter(Boolean),
          weaknesses: reviewForm.weaknesses.split('\n').filter(Boolean),
          suggestions: reviewForm.suggestions.split('\n').filter(Boolean),
          responseTime: reviewForm.responseTime,
          communication: reviewForm.communication,
          execution: reviewForm.execution,
          overallRating: reviewForm.overallRating,
        },
        lessons: lessons.map((l, idx) => ({
          id: `lesson_${id}_${idx}`,
          title: l.slice(0, 30),
          description: l,
          category: event.category,
        })),
      });
    }

    addTimelineEvent({
      eventId: id,
      type: 'note',
      title: '完成事件复盘',
      description: `综合评分 ${reviewForm.overallRating}/5，${lessons.length} 条经验教训`,
      createdBy: currentUserId,
    });

    setReviewForm({
      strengths: '', weaknesses: '', rootCause: '', suggestions: '',
      responseTime: 3, communication: 3, execution: 3, overallRating: 3, lessonsText: '',
    });
  };

  const sentimentChartData = useMemo(() => {
    if (filteredSentiments.length === 0) return [];
    return filteredSentiments.map((s) => ({
      date: formatDate(s.recordedAt).slice(5),
      提及量: s.mentionCount,
      负面: s.negativeCount,
      中性: s.neutralCount,
      正面: s.positiveCount,
    }));
  }, [filteredSentiments]);

  const sentimentPieData = useMemo(() => {
    if (filteredSentiments.length === 0) return [];
    const total = filteredSentiments[filteredSentiments.length - 1];
    return [
      { name: '负面', value: total.negativeCount },
      { name: '中性', value: total.neutralCount },
      { name: '正面', value: total.positiveCount },
    ].filter((d) => d.value > 0);
  }, [filteredSentiments]);

  const platformChartData = useMemo(() => {
    if (filteredSentiments.length === 0) return [];
    const platformMap = new Map<string, number>();
    filteredSentiments.forEach((s) => {
      (s.platformBreakdown || []).forEach((pb) => {
        const label = getPlatformLabel(pb.platform);
        platformMap.set(label, (platformMap.get(label) || 0) + pb.count);
      });
    });
    return Array.from(platformMap.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSentiments]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [], in_progress: [], review: [], completed: [], cancelled: [],
    };
    tasks.forEach((t) => map[t.status].push(t));
    return map;
  }, [tasks]);

  if (loading) {
    return (
      <PageContainer title="加载中..." subtitle="正在加载事件详情">
        <div className="space-y-4">
          <div className="card p-6 h-40 animate-pulse bg-slate-100" />
          <div className="card p-6 h-64 animate-pulse bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

  if (!event) {
    return (
      <PageContainer title="事件不存在" subtitle="该事件可能已被删除或ID无效">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12" />}
          title="事件不存在"
          description="请检查事件ID是否正确，或返回事件列表查看其他事件"
          action={
            <Button onClick={() => navigate('/events')}>返回事件列表</Button>
          }
        />
      </PageContainer>
    );
  }

  const isResolved = event.status === 'resolved' || event.status === 'archived';
  const severityCfg = getSeverityConfig(event.severity);

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 space-y-4">
        <div className="card p-5">
          <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">事件起因</p>
              <p className="text-slate-700 leading-relaxed">{event.cause}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">发现时间</p>
              <p className="text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDateTime(event.discoveredAt)}
                <span className="text-slate-400">({formatRelative(event.discoveredAt)})</span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">涉及平台</p>
              <div className="flex flex-wrap gap-1.5">
                {event.platforms.length > 0 ? event.platforms.map((p) => (
                  <span key={p} className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {getPlatformLabel(p)}
                  </span>
                )) : <span className="text-slate-400">未填写</span>}
              </div>
            </div>
            <div>
              <p className="text-slate-400 mb-1">事件分类</p>
              <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', severityCfg.bgColor, severityCfg.textColor)}>
                {event.category}
              </span>
            </div>
            <div>
              <p className="text-slate-400 mb-1">当前传播量级</p>
              <p className="text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {formatReach(event.currentReach ?? event.initialReach)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">峰值传播量级</p>
              <p className="text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                {formatReach(event.peakReach ?? event.initialReach)}
              </p>
            </div>
            {event.resolvedAt && (
              <div>
                <p className="text-slate-400 mb-1">解决时间</p>
                <p className="text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {formatDateTime(event.resolvedAt)}
                  <span className="text-slate-400">
                    (历时 {daysBetween(event.discoveredAt, event.resolvedAt)} 天)
                  </span>
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-400 mb-1">创建人</p>
              <p className="text-slate-700">
                {getUserById(event.createdBy)?.name || '未知用户'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-slate-400 mb-2 text-sm">详细描述</p>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {event.description || '暂无详细描述'}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-4">
        <div className="card p-5">
          <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4.5 h-4.5" />
            参与成员
          </h3>
          {assigneeUsers.length === 0 ? (
            <p className="text-sm text-slate-400">暂无成员</p>
          ) : (
            <div className="space-y-3">
              {assigneeUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400">
                      {getRoleLabel(user.role)} · {user.department}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5" />
            最近动态
          </h3>
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-400">暂无动态</p>
          ) : (
            <div className="space-y-3">
              {[...timeline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((tl) => (
                <div key={tl.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 truncate">{tl.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelative(tl.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">共 {tasks.length} 个任务</p>
        <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowTaskModal(true)}>
          新建任务
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" style={{ minHeight: 500 }}>
        {TASK_STATUS_LIST.map((status) => (
          <TaskKanbanColumn
            key={status}
            title={TASK_STATUS_LABELS[status]}
            status={status}
            tasks={tasksByStatus[status]}
            users={users}
            events={[event]}
            onAddTask={() => setShowTaskModal(true)}
            onTaskClick={(task) => handleTaskStatusUpdate(task, getNextStatus(task.status))}
          />
        ))}
      </div>
    </div>
  );

  const getNextStatus = (status: TaskStatus): TaskStatus => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed'];
    const idx = order.indexOf(status);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : status;
  };

  const renderCommunications = () => (
    <div>
      {docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="暂无沟通文档"
          description="沟通文档用于记录对外声明、媒体回复、内部报告等内容"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((doc) => {
            const docCfg = getDocTypeConfig(doc.type);
            const appCfg = getApprovalStatusConfig(doc.approvalStatus);
            const latestVer = doc.versions[doc.versions.length - 1];
            const createdBy = getUserById(doc.createdBy);
            return (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setDocEditContent(latestVer?.content || '');
                  setDocEditChangeLog('');
                  setApprovalComment('');
                }}
                className="card p-5 hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{docCfg.icon}</span>
                    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', appCfg.bgColor, appCfg.textColor)}>
                      {appCfg.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    V{latestVer?.version || '0.1'}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-slate-800 mb-2 line-clamp-1">{doc.title}</h4>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  <span>{createdBy?.name || '未知'}</span>
                  <span>{formatRelative(doc.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSentiment = () => (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            舆情监测看板
          </h3>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {([
              { key: '24h', label: '近24小时' },
              { key: '7d', label: '近7天' },
              { key: 'all', label: '全部记录' },
            ] as const).map((r) => (
              <button
                key={r.key}
                onClick={() => setSentimentRange(r.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  sentimentRange === r.key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">总提及量</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-serif font-bold text-slate-800">
              {formatReach(sentimentMetrics.totalMentions)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">共 {filteredSentiments.length} 条记录</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-red-50 to-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">负面占比</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-serif font-bold text-red-600">
              {sentimentMetrics.negativeRatio}<span className="text-sm font-normal ml-0.5">%</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatReach((sentimentMetrics as any).totalNeg || 0)} 负面 · {formatReach((sentimentMetrics as any).totalPos || 0)} 正面
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-orange-50 to-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">传播峰值</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-serif font-bold text-orange-600">
              {formatReach(sentimentMetrics.peakReach)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sentimentMetrics.peakDate ? formatDate(sentimentMetrics.peakDate) : '-'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">主要平台</span>
              <Globe className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-serif font-bold text-indigo-600 truncate">
              {sentimentMetrics.topPlatform?.label || '-'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sentimentMetrics.topPlatform ? `${formatReach(sentimentMetrics.topPlatform.count)} 提及` : '暂无平台数据'}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Plus className={cn('w-4 h-4 transition-transform', showSentimentForm && 'rotate-45')} />
            录入舆情数据
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowSentimentForm(!showSentimentForm)}>
            {showSentimentForm ? '收起' : '展开'}
            {showSentimentForm ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
        {showSentimentForm && (
          <SentimentForm
            eventId={id}
            onSubmit={handleSentimentSubmit}
            onCancel={() => setShowSentimentForm(false)}
          />
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">舆情趋势</h3>
        {sentimentChartData.length === 0 ? (
          <EmptyState title="暂无舆情数据" description="请先录入舆情数据以查看趋势" />
        ) : (
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentChartData}>
                <defs>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="提及量" stroke="#3b82f6" strokeWidth={2} fill="url(#colorNeg)" />
                <Area type="monotone" dataKey="负面" stroke={SENTIMENT_COLORS.negative} strokeWidth={2} fill="none" />
                <Area type="monotone" dataKey="正面" stroke={SENTIMENT_COLORS.positive} strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">最新情感分布</h3>
          {sentimentPieData.length === 0 ? (
            <EmptyState title="暂无数据" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {sentimentPieData.map((_, idx) => (
                      <Cell key={idx} fill={Object.values(SENTIMENT_COLORS)[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">各平台分布</h3>
          {platformChartData.length === 0 ? (
            <EmptyState title="暂无平台数据" description="录入舆情数据时请填写平台分解信息" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatReach(v)} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: number) => [formatReach(v), '提及量']} />
                  <Bar dataKey="count" name="提及量" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => {
    const filteredTimeline = timelineFilter === 'all'
      ? timeline
      : timeline.filter((t) => t.type === timelineFilter);

    const sortedTimeline = [...filteredTimeline].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const typeLabel: Record<TimelineEvent['type'], string> = {
      status_change: '状态变更',
      task: '任务',
      communication: '沟通记录',
      sentiment_update: '舆情更新',
      external: '外部事件',
      note: '备注',
    };

    const exportTimeline = () => {
      const title = `事件复盘记录 - ${event?.title || '未命名事件'}\n`;
      const meta = `导出时间：${formatDateTime(new Date().toISOString())}\n\n`;
      const content = sortedTimeline
        .map((t, idx) => {
          return [
            `【${idx + 1}】${formatDateTime(t.timestamp)} · ${typeLabel[t.type]}`,
            `标题：${t.title}`,
            t.description ? `说明：${t.description}` : null,
            `操作人：${getUserById(t.createdBy)?.name || t.createdBy}`,
          ].filter(Boolean).join('\n');
        })
        .join('\n\n');
      const fullText = `${title}${meta}${content}`;
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event?.title || '复盘记录'}_时间线导出.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              共 {filteredTimeline.length} 条时间节点
            </p>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 flex-wrap">
              <button
                onClick={() => setTimelineFilter('all')}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                  timelineFilter === 'all'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                全部
              </button>
              {(Object.keys(typeLabel) as TimelineEvent['type'][]).map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTimelineFilter(tp)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                    timelineFilter === tp
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {typeLabel[tp]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timelineFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<X className="w-3.5 h-3.5" />}
                onClick={() => setTimelineFilter('all')}
              >
                清除筛选
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={exportTimeline}
            >
              导出记录
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowTimelineModal(true)}>
              添加节点
            </Button>
          </div>
        </div>
        <EventTimeline events={sortedTimeline} />
      </div>
    );
  };

  const renderReview = () => {
    if (!isResolved && !review) {
      return (
        <div className="card p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5 text-slate-400">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-slate-700 mb-2">事件未平息，暂不可填写复盘</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            请先将事件状态流转至"已解决"后再进行复盘填写。
            当前状态：<EventStatusBadge status={event.status} />
          </p>
        </div>
      );
    }

    if (review) {
      const radarData = [
        { subject: '响应速度', value: review.responseTime },
        { subject: '沟通效果', value: review.communication },
        { subject: '执行能力', value: review.execution },
        { subject: '整体评分', value: review.overallRating },
      ];
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-4">
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                亮点与优点
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{review.strengths}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                不足与问题
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{review.weaknesses}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Radar className="w-5 h-5 text-purple-500" />
                根本原因
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{review.rootCause}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                改进建议
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{review.suggestions}</p>
            </div>
            {review.lessons.length > 0 && (
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">经验教训</h3>
                <div className="space-y-3">
                  {review.lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{lesson}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">各维度评分</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} angle={90} />
                    <RadarChartComp name="评分" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                {radarData.map((d) => (
                  <div key={d.subject} className="p-2 rounded-lg bg-slate-50">
                    <div className="text-slate-400 mb-0.5">{d.subject}</div>
                    <div className="font-bold text-slate-800 text-lg">{d.value}<span className="text-xs text-slate-400">/5</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-400 mb-1">复盘完成人</p>
              <p className="text-sm text-slate-700 mb-3">
                {getUserById(review.completedBy)?.name || '未知'}
              </p>
              <p className="text-xs text-slate-400 mb-1">复盘完成时间</p>
              <p className="text-sm text-slate-700">{formatDateTime(review.completedAt)}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card p-6 space-y-5">
        <h3 className="font-serif text-lg font-semibold text-slate-800">填写事件复盘报告</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> 亮点与优点
            </label>
            <textarea rows={5} value={reviewForm.strengths}
              onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
              placeholder="本次事件应对中的做得好的地方..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" /> 不足与问题
            </label>
            <textarea rows={5} value={reviewForm.weaknesses}
              onChange={(e) => setReviewForm({ ...reviewForm, weaknesses: e.target.value })}
              placeholder="本次事件暴露的问题和不足之处..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-1">
              <Radar className="w-4 h-4 text-purple-500" /> 根本原因分析
            </label>
            <textarea rows={5} value={reviewForm.rootCause}
              onChange={(e) => setReviewForm({ ...reviewForm, rootCause: e.target.value })}
              placeholder="导致事件发生的深层原因..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-amber-500" /> 改进建议
            </label>
            <textarea rows={5} value={reviewForm.suggestions}
              onChange={(e) => setReviewForm({ ...reviewForm, suggestions: e.target.value })}
              placeholder="后续可以改进的具体措施和建议..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">经验教训（每行一条）</label>
          <textarea rows={4} value={reviewForm.lessonsText}
            onChange={(e) => setReviewForm({ ...reviewForm, lessonsText: e.target.value })}
            placeholder={'总结的经验教训，每行一条...\n例如：\n宣传内容必须走合规审核\n主动认错优于被动辩解'}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['responseTime', 'communication', 'execution', 'overallRating'] as const).map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {key === 'responseTime' && '响应速度'}
                {key === 'communication' && '沟通效果'}
                {key === 'execution' && '执行能力'}
                {key === 'overallRating' && '整体评分'}
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setReviewForm({ ...reviewForm, [key]: v })}
                    className={cn('flex-1 h-9 rounded-lg text-sm font-medium transition-all',
                      reviewForm[key] >= v ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmitReview}>提交复盘报告</Button>
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/events')}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <span>{event.title}</span>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          {event.status !== 'archived' && (
            <Button variant="secondary" size="sm" leftIcon={<Archive className="w-4 h-4" />} onClick={handleArchive}>
              归档
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <EventStatusBadge status={event.status} />
              <SeverityIndicator level={event.severity} showLabel />
              {event.tags.length > 0 && event.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              {EVENT_STATUS_STEPS.slice(0, -1).map((step) => {
                const stepIdx = EVENT_STATUS_STEPS.findIndex((s) => s.key === step.key);
                const active = stepIdx <= currentStepIndex;
                const isCurrent = stepIdx === currentStepIndex;
                const cfg = getEventStatusConfig(step.key);
                return (
                  <button
                    key={step.key}
                    onClick={() => handleStatusChange(step.key)}
                    disabled={event.status === 'archived'}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                      isCurrent ? cn(cfg.bgColor, cfg.textColor, 'ring-2 ring-offset-1 ring-slate-200') :
                      active ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' :
                      'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    )}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>
          <StatusStepper steps={EVENT_STATUS_STEPS.map((s) => ({ key: s.key, label: s.label }))} currentStep={currentStepIndex} />
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="flex gap-1 px-2 border-b border-slate-100 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                    active ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="p-5">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'tasks' && renderTasks()}
            {activeTab === 'communications' && renderCommunications()}
            {activeTab === 'sentiment' && renderSentiment()}
            {activeTab === 'timeline' && renderTimeline()}
            {activeTab === 'review' && renderReview()}
          </div>
        </div>
      </div>

      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="新建任务" maxWidth="lg">
        <TaskForm onSubmit={handleCreateTask} onCancel={() => setShowTaskModal(false)} />
      </Modal>

      <Modal open={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="添加时间节点" maxWidth="lg">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">节点类型</label>
            <select value={timelineForm.type}
              onChange={(e) => setTimelineForm({ ...timelineForm, type: e.target.value as TimelineEvent['type'] })}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option value="note">备注</option>
              <option value="status_change">状态变更</option>
              <option value="task">任务</option>
              <option value="communication">沟通记录</option>
              <option value="sentiment_update">舆情更新</option>
              <option value="external">外部事件</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">标题 <span className="text-red-500">*</span></label>
            <input type="text" value={timelineForm.title}
              onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })}
              placeholder="简洁描述该时间节点"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">详细说明</label>
            <textarea rows={4} value={timelineForm.description}
              onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })}
              placeholder="补充说明..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">时间</label>
            <input type="datetime-local" value={timelineForm.timestamp}
              onChange={(e) => setTimelineForm({ ...timelineForm, timestamp: e.target.value })}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowTimelineModal(false)}>取消</Button>
            <Button onClick={() => {
              addTimelineEvent({
                ...timelineForm,
                eventId: id,
                timestamp: new Date(timelineForm.timestamp).toISOString(),
                createdBy: currentUserId,
              });
              setShowTimelineModal(false);
              setTimelineForm({ type: 'note', title: '', description: '', timestamp: new Date().toISOString().slice(0, 16) });
            }}>确认添加</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedDoc}
        onClose={() => { setSelectedDoc(null); setDocEditContent(''); }}
        title={selectedDoc?.title || '文档详情'}
        maxWidth="xl"
      >
        {selectedDoc && (() => {
          const latestVer = selectedDoc.versions[selectedDoc.versions.length - 1];
          const appCfg = getApprovalStatusConfig(selectedDoc.approvalStatus);
          const isDraft = selectedDoc.approvalStatus === 'draft' || selectedDoc.approvalStatus === 'rejected';

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm">{getDocTypeConfig(selectedDoc.type).icon}</span>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', appCfg.bgColor, appCfg.textColor)}>
                  {appCfg.label}
                </span>
                <span className="text-xs text-slate-400">
                  当前版本：V{latestVer?.version || '0.1'}（共 {selectedDoc.versions.length} 个版本）
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">编辑内容</label>
                    <textarea
                      value={docEditContent}
                      onChange={(e) => setDocEditContent(e.target.value)}
                      rows={14}
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 font-sans leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={docEditChangeLog}
                        onChange={(e) => setDocEditChangeLog(e.target.value)}
                        placeholder="变更说明（可选）"
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <Button
                      size="sm"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                      onClick={handleSaveDocVersion}
                      disabled={docEditContent === (latestVer?.content || '')}
                    >
                      保存新版本
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">版本历史</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto scroll-thin">
                      {[...selectedDoc.versions].reverse().map((v) => (
                        <div key={v.version} className="text-xs p-2 rounded bg-white border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">V{v.version}</span>
                            <span className="text-slate-400">{formatRelative(v.createdAt)}</span>
                          </div>
                          {v.changeLog && <p className="text-slate-500 mt-0.5 truncate">{v.changeLog}</p>}
                          <p className="text-slate-400">{getUserById(v.createdBy)?.name || '未知'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">审批操作</h4>
                    {selectedDoc.approvals.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {selectedDoc.approvals.map((a) => {
                          const aCfg = getApprovalStatusConfig(a.status);
                          return (
                            <div key={a.id} className="text-xs p-2 rounded bg-white border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">{getUserById(a.approverId)?.name || '未知'}</span>
                                <span className={cn('px-1.5 py-0.5 rounded text-[10px]', aCfg.bgColor, aCfg.textColor)}>{aCfg.label}</span>
                              </div>
                              {a.comment && <p className="text-slate-500 mt-0.5">{a.comment}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isDraft && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        onClick={handleSubmitApproval}
                      >
                        提交审批
                      </Button>
                    )}

                    {selectedDoc.approvalStatus === 'pending' && (
                      <div className="space-y-2">
                        <textarea
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          placeholder="审批意见..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" className="flex-1" onClick={() => handleApprove('approved')}>
                            通过
                          </Button>
                          <Button size="sm" variant="danger" className="flex-1" onClick={() => handleApprove('rejected')}>
                            驳回
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>创建人：{getUserById(selectedDoc.createdBy)?.name || '未知'}</span>
                <span>创建时间：{formatDateTime(selectedDoc.createdAt)}</span>
              </div>
            </div>
          );
        })()}
      </Modal>
    </PageContainer>
  );
}
