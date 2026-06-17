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
import { formatDate, daysBetween } from '@/utils/date';
import { getSeverityConfig } from '@/utils/status';
import { getInitials } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { KnowledgeBaseCase } from '@/types';

export default function KnowledgeDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { initUsers, getUserById } = useUserStore();
  const { initAll, getCaseById, cases } = useKnowledgeStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUsers();
    initAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [initUsers, initAll]);

  const caseItem = useMemo(
    () => getCaseById(id),
    [id, getCaseById, cases]
  );

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

          <h1 className="font-serif text-2xl font-bold text-slate-800 leading-tight mb-4">
            {caseItem.title}
          </h1>

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
