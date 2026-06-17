import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Radar,
  AlertTriangle,
  FileText,
  ArrowRight,
  ExternalLink,
  GripVertical,
  Flag,
  CheckSquare,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RadarComp,
  Tooltip,
} from 'recharts';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/common/EmptyState';
import SeverityIndicator from '@/components/events/SeverityIndicator';
import { useUserStore } from '@/store/userStore';
import { useKnowledgeStore } from '@/store/knowledgeStore';
import { useEventStore } from '@/store/eventStore';
import { useTaskStore } from '@/store/taskStore';
import { useDocStore } from '@/store/docStore';
import { formatDate, daysBetween } from '@/utils/date';
import { getSeverityConfig, getEventStatusConfig as getStatusConfig, getPlatformLabel } from '@/utils/status';
import { getInitials } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { KnowledgeBaseCase, Task } from '@/types';

export default function KnowledgeDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { initUsers, getUserById } = useUserStore();
  const { initAll, getCaseById, cases, getTimelineByEventId, getSentimentByEventId } = useKnowledgeStore();
  const { initEvents, getEventById } = useEventStore();
  const { initTasks, getTasksByEventId } = useTaskStore();
  const { initDocs, getDocsByEventId } = useDocStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUsers();
    initAll();
    initEvents();
    initTasks();
    initDocs();
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [initUsers, initAll, initEvents, initTasks, initDocs]);

  const caseItem = useMemo(
    () => getCaseById(id),
    [id, getCaseById, cases]
  );

  const linkedEvent = useMemo(() => {
    if (!caseItem) return null;
    const eventId = caseItem.id.startsWith('kb_')
      ? caseItem.id.slice(3)
      : caseItem.id;
    return getEventById(eventId);
  }, [caseItem, getEventById]);

  const eventTimeline = useMemo(() => {
    if (!linkedEvent) return [];
    return getTimelineByEventId(linkedEvent.id);
  }, [linkedEvent, getTimelineByEventId]);

  const eventTasks = useMemo<Task[]>(() => {
    if (!linkedEvent) return [];
    return getTasksByEventId(linkedEvent.id);
  }, [linkedEvent, getTasksByEventId]);

  const eventDocs = useMemo(() => {
    if (!linkedEvent) return [];
    return getDocsByEventId(linkedEvent.id);
  }, [linkedEvent, getDocsByEventId]);

  const eventSentiments = useMemo(() => {
    if (!linkedEvent) return [];
    return getSentimentByEventId(linkedEvent.id);
  }, [linkedEvent, getSentimentByEventId]);

  const taskStats = useMemo(() => {
    const total = eventTasks.length;
    const completed = eventTasks.filter((t) => t.status === 'completed').length;
    const cancelled = eventTasks.filter((t) => t.status === 'cancelled').length;
    const inProgress = total - completed - cancelled;
    return { total, completed, inProgress, cancelled, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [eventTasks]);

  const sentimentPeak = useMemo(() => {
    if (eventSentiments.length === 0) return null;
    let peak = eventSentiments[0];
    eventSentiments.forEach((s) => {
      if (s.mentionCount > peak.mentionCount) peak = s;
    });
    return peak;
  }, [eventSentiments]);

  const similarCases = useMemo(() => {
    if (!caseItem) return [];
    return cases
      .filter((c) => c.id !== caseItem.id && c.category === caseItem.category)
      .slice(0, 3);
  }, [caseItem, cases]);

  if (loading) {
    return (
      <PageContainer title="加载中..." subtitle="正在加载案例详情">
        <div className="space-y-4">
          <div className="card p-6 h-40 animate-pulse bg-slate-100" />
          <div className="card p-6 h-80 animate-pulse bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

  if (!caseItem) {
    return (
      <PageContainer title="案例不存在" subtitle="该案例可能已被删除或ID无效">
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="案例不存在"
          description="请检查案例ID是否正确，或返回知识库查看其他案例"
          action={
            <button
              onClick={() => navigate('/knowledge')}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              返回知识库
            </button>
          }
        />
      </PageContainer>
    );
  }

  const severityCfg = getSeverityConfig(caseItem.severity);
  const duration = daysBetween(caseItem.startedAt, caseItem.resolvedAt);
  const totalDays = daysBetween(caseItem.startedAt, caseItem.archivedAt);

  const radarData = [
    { subject: '响应速度', value: caseItem.reviewSummary.responseTime, fullMark: 5 },
    { subject: '沟通效果', value: caseItem.reviewSummary.communication, fullMark: 5 },
    { subject: '执行能力', value: caseItem.reviewSummary.execution, fullMark: 5 },
    { subject: '整体评分', value: caseItem.reviewSummary.overallRating, fullMark: 5 },
  ];

  const rating = caseItem.reviewSummary.overallRating;
  const stakeholders = caseItem.stakeholders
    .map((uid) => getUserById(uid))
    .filter(Boolean);

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/knowledge')}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <span className="truncate">案例详情</span>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn(
                'inline-flex items-center rounded px-2.5 py-1 text-xs font-medium',
                severityCfg.bgColor, severityCfg.textColor
              )}>
                {caseItem.category}
              </span>
              <SeverityIndicator level={caseItem.severity} showLabel />
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                    )}
                  />
                ))}
                <span className="ml-1.5 text-sm font-semibold text-slate-700">{rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(caseItem.startedAt)} 发生
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                处理历时 {duration} 天
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                共历时 {totalDays} 天归档
              </span>
            </div>
          </div>

          <h1 className="font-serif text-2xl font-bold text-slate-800 leading-tight mb-2">
            {caseItem.title}
          </h1>

          {linkedEvent && (
            <div className="mb-4">
              <Link
                to={`/events/${linkedEvent.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                查看原事件详情
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>参与人员：</span>
              <div className="flex -space-x-2">
                {stakeholders.slice(0, 5).map((u) => u && (
                  u.avatar ? (
                    <img
                      key={u.id}
                      src={u.avatar}
                      alt={u.name}
                      className="h-6 w-6 rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <div
                      key={u.id}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-medium text-white"
                    >
                      {getInitials(u.name)}
                    </div>
                  )
                ))}
                {stakeholders.length > 5 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-medium text-slate-600">
                    +{stakeholders.length - 5}
                  </div>
                )}
              </div>
            </div>
            <span>
              归档时间：{formatDate(caseItem.archivedAt)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {linkedEvent && (
              <div className="card p-5 border-l-4 border-l-green-500">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Flag className="w-4.5 h-4.5 text-green-600" />
                  最终处置结果
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400 mb-1">最终状态</p>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className={cn(
                        'inline-block w-2 h-2 rounded-full',
                        getStatusConfig(linkedEvent.status).dotColor
                      )} />
                      {getStatusConfig(linkedEvent.status).label}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400 mb-1">峰值传播量</p>
                    <p className="text-sm font-semibold text-slate-800 font-serif">
                      {linkedEvent.peakReach ? new Intl.NumberFormat('zh-CN').format(linkedEvent.peakReach) : '-'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400 mb-1">解决时间</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {linkedEvent.resolvedAt ? formatDate(linkedEvent.resolvedAt) : '未解决'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400 mb-1">处理历时</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {linkedEvent.resolvedAt ? `${daysBetween(linkedEvent.discoveredAt, linkedEvent.resolvedAt)} 天` : '进行中'}
                    </p>
                  </div>
                </div>
                {linkedEvent.statusHistory && linkedEvent.statusHistory.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400 mb-2">状态流转记录：</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {linkedEvent.statusHistory.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            getStatusConfig(s.status).bgColor, getStatusConfig(s.status).textColor
                          )}>
                            {getStatusConfig(s.status).label}
                          </span>
                          {idx < linkedEvent.statusHistory.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {eventTimeline.length > 0 && (
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <GripVertical className="w-4.5 h-4.5 text-indigo-500" />
                  关键时间线摘要
                  <span className="text-xs font-normal text-slate-400 ml-1">（共 {eventTimeline.length} 条节点）</span>
                </h3>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-indigo-200 to-transparent" />
                  {eventTimeline.slice(0, 10).map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-white border-2 border-indigo-400" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{e.title}</p>
                          {e.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{e.description}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">
                          {formatDate(e.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {eventTimeline.length > 10 && (
                    <p className="text-xs text-slate-400 text-center pt-1">
                      另有 {eventTimeline.length - 10} 条节点，前往原事件查看完整时间线
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                事件起因
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {caseItem.description}
              </p>
            </div>

            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-500" />
                应对过程摘要
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {caseItem.summary}
              </p>
            </div>

            {eventTasks.length > 0 && (
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4.5 h-4.5 text-green-500" />
                  关联任务完成情况
                  <span className="text-xs font-normal text-slate-400 ml-1">（{taskStats.rate}% 完成率）</span>
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                      style={{ width: `${taskStats.rate}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 完成 {taskStats.completed}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 进行中 {taskStats.inProgress}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> 总 {taskStats.total}</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {eventTasks.slice(0, 8).map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        'flex items-start justify-between gap-2 p-3 rounded-lg border transition-all',
                        t.status === 'completed'
                          ? 'bg-green-50/50 border-green-100'
                          : t.status === 'cancelled'
                            ? 'bg-slate-50 border-slate-100 opacity-70'
                            : 'bg-white border-slate-100'
                      )}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={cn(
                          'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                          t.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-slate-300'
                        )}>
                          {t.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            t.status === 'completed' ? 'text-slate-700 line-through' : 'text-slate-800'
                          )}>
                            {t.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t.assigneeId && getUserById(t.assigneeId)?.name} · 截止 {formatDate(t.deadline)}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0',
                        t.status === 'completed' && 'bg-green-100 text-green-700',
                        t.status === 'in_progress' && 'bg-blue-100 text-blue-700',
                        t.status === 'todo' && 'bg-slate-100 text-slate-600',
                        t.status === 'review' && 'bg-amber-100 text-amber-700',
                        t.status === 'cancelled' && 'bg-slate-100 text-slate-500',
                      )}>
                        {t.status === 'completed' && '完成'}
                        {t.status === 'in_progress' && '进行中'}
                        {t.status === 'todo' && '待办'}
                        {t.status === 'review' && '待验收'}
                        {t.status === 'cancelled' && '已取消'}
                      </span>
                    </div>
                  ))}
                  {eventTasks.length > 8 && (
                    <p className="text-xs text-slate-400 text-center pt-1">另有 {eventTasks.length - 8} 项任务，前往原事件查看</p>
                  )}
                </div>
              </div>
            )}

            {eventDocs.length > 0 && (
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-purple-500" />
                  关键沟通文档
                  <span className="text-xs font-normal text-slate-400 ml-1">（共 {eventDocs.length} 份）</span>
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {eventDocs.slice(0, 6).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5 w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            v{d.currentVersion || 1} · {d.versions.length} 个版本 · {formatDate(d.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0',
                        d.approvalStatus === 'approved' && 'bg-green-100 text-green-700',
                        d.approvalStatus === 'pending' && 'bg-amber-100 text-amber-700',
                        d.approvalStatus === 'rejected' && 'bg-red-100 text-red-700',
                        d.approvalStatus === 'draft' && 'bg-slate-100 text-slate-600',
                      )}>
                        {d.approvalStatus === 'approved' && '审批通过'}
                        {d.approvalStatus === 'pending' && '审批中'}
                        {d.approvalStatus === 'rejected' && '审批驳回'}
                        {d.approvalStatus === 'draft' && '草稿'}
                      </span>
                    </div>
                  ))}
                  {eventDocs.length > 6 && (
                    <p className="text-xs text-slate-400 text-center pt-1">另有 {eventDocs.length - 6} 份文档，前往原事件查看</p>
                  )}
                </div>
              </div>
            )}

            {sentimentPeak && (
              <div className="card p-5 border-l-4 border-l-orange-400">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-orange-500" />
                  舆情峰值节点
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="rounded-lg bg-orange-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-0.5">峰值日期</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(sentimentPeak.recordedAt)}</p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-0.5">峰值提及量</p>
                    <p className="text-sm font-semibold text-slate-800 font-serif">
                      {new Intl.NumberFormat('zh-CN').format(sentimentPeak.mentionCount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-0.5">峰值负面量</p>
                    <p className="text-sm font-semibold text-red-600 font-serif">
                      {new Intl.NumberFormat('zh-CN').format(sentimentPeak.negativeCount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-0.5">负面占比</p>
                    <p className="text-sm font-semibold text-red-600 font-serif">
                      {sentimentPeak.mentionCount > 0
                        ? Math.round((sentimentPeak.negativeCount / sentimentPeak.mentionCount) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
                {sentimentPeak.platformBreakdown && sentimentPeak.platformBreakdown.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] text-slate-400 mb-2">峰值当日平台分布：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sentimentPeak.platformBreakdown.map((pb) => (
                        <span
                          key={pb.platform}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
                        >
                          <span className="font-medium text-slate-800">{getPlatformLabel(pb.platform)}</span>
                          <span className="text-slate-500">{new Intl.NumberFormat('zh-CN').format(pb.count)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {sentimentPeak.note && (
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <p className="text-[11px] text-slate-400 mb-1">当时记录备注：</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{sentimentPeak.note}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                  亮点与优点
                </h3>
                <ul className="space-y-2.5">
                  {caseItem.reviewSummary.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-4.5 h-4.5 text-red-500" />
                  不足与问题
                </h3>
                <ul className="space-y-2.5">
                  {caseItem.reviewSummary.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                改进建议
              </h3>
              <ul className="space-y-2.5">
                {caseItem.reviewSummary.suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="w-4.5 h-4.5 text-amber-500" />
                经验教训 <span className="text-sm font-normal text-slate-400 ml-1">（共 {caseItem.lessons.length} 条）</span>
              </h3>
              <div className="space-y-3">
                {caseItem.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-300" />
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400 text-white text-xs font-bold shadow-sm">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800">
                          {lesson.title}
                        </h4>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium flex-shrink-0">
                        {lesson.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-8">
                      {lesson.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="card p-5 sticky top-6">
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Radar className="w-4.5 h-4.5 text-purple-500" />
                各维度评分
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <RadarComp
                      name="评分"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="#8b5cf6"
                      fillOpacity={0.35}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}/5`, '评分']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { label: '响应速度', value: caseItem.reviewSummary.responseTime },
                  { label: '沟通效果', value: caseItem.reviewSummary.communication },
                  { label: '执行能力', value: caseItem.reviewSummary.execution },
                  { label: '整体评分', value: caseItem.reviewSummary.overallRating },
                ].map((d) => (
                  <div key={d.label} className="p-2.5 rounded-lg bg-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 mb-0.5">{d.label}</p>
                    <p className="text-lg font-bold text-slate-800 font-serif">
                      {d.value}<span className="text-xs text-slate-400 font-normal ml-0.5">/5</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {similarCases.length > 0 && (
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-3">
                  相似案例推荐
                </h3>
                <div className="space-y-2">
                  {similarCases.map((sc) => (
                    <Link
                      key={sc.id}
                      to={`/knowledge/${sc.id}`}
                      className="block p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {sc.title}
                        </h4>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-500 flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <SeverityIndicator level={sc.severity} />
                        <span>{formatDate(sc.archivedAt).slice(0, 7)}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{sc.reviewSummary.overallRating}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
