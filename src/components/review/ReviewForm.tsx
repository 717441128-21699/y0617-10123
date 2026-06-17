import { useState, useMemo } from 'react';
import { X, Save, Lightbulb, Target, AlertCircle, CheckCircle2, Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import TagInput from '@/components/common/TagInput';
import RatingStars from './RatingStars';
import { useUserStore } from '@/store/userStore';
import { useKnowledgeStore } from '@/store/knowledgeStore';
import type { ReviewSummary } from '@/types';

interface ReviewFormProps {
  eventId: string;
  initialData?: Partial<ReviewSummary>;
  onSubmit?: (summary: ReviewSummary) => void;
  onCancel: () => void;
  className?: string;
}

interface RatingItem {
  key: 'responseTime' | 'communication' | 'execution';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const LESSON_SUGGESTIONS = [
  '建立快速响应机制',
  '完善内部沟通流程',
  '加强数据安全防护',
  '优化危机应对预案',
  '提升媒体沟通能力',
  '强化供应商管理',
  '改进产品质量管控',
  '完善合规审核体系',
];

const ratingItems: RatingItem[] = [
  {
    key: 'responseTime',
    label: '响应时长',
    description: '从事件发现到启动应对的时效性',
    icon: <RotateCcw className="w-4 h-4" />,
  },
  {
    key: 'communication',
    label: '沟通效果',
    description: '对内对外沟通的清晰度和有效性',
    icon: <Lightbulb className="w-4 h-4" />,
  },
  {
    key: 'execution',
    label: '执行效率',
    description: '应对措施的落地执行力度和成果',
    icon: <Target className="w-4 h-4" />,
  },
];

export default function ReviewForm({
  eventId,
  initialData,
  onSubmit,
  onCancel,
  className,
}: ReviewFormProps) {
  const { currentUser } = useUserStore();
  const { addReviewSummary, reviewSummaries, getReviewByEventId } = useKnowledgeStore();

  const existingReview = eventId ? getReviewByEventId(eventId) : undefined;
  const data = existingReview || initialData;

  const [responseTime, setResponseTime] = useState<number>(data?.responseTime || 0);
  const [communication, setCommunication] = useState<number>(data?.communication || 0);
  const [execution, setExecution] = useState<number>(data?.execution || 0);
  const [strengths, setStrengths] = useState<string>(data?.strengths || '');
  const [weaknesses, setWeaknesses] = useState<string>(data?.weaknesses || '');
  const [rootCause, setRootCause] = useState<string>(data?.rootCause || '');
  const [suggestions, setSuggestions] = useState<string>(data?.suggestions || '');
  const [lessons, setLessons] = useState<string[]>(data?.lessons || []);

  const overallRating = useMemo(() => {
    const ratings = [responseTime, communication, execution].filter((r) => r > 0);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }, [responseTime, communication, execution]);

  const isFormValid =
    responseTime > 0 &&
    communication > 0 &&
    execution > 0 &&
    strengths.trim() &&
    weaknesses.trim() &&
    rootCause.trim() &&
    suggestions.trim();

  const handleRatingChange = (key: RatingItem['key']) => (value: number) => {
    switch (key) {
      case 'responseTime':
        setResponseTime(value);
        break;
      case 'communication':
        setCommunication(value);
        break;
      case 'execution':
        setExecution(value);
        break;
    }
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    const summary = addReviewSummary({
      eventId,
      strengths: strengths.trim(),
      weaknesses: weaknesses.trim(),
      rootCause: rootCause.trim(),
      suggestions: suggestions.trim(),
      responseTime,
      communication,
      execution,
      overallRating,
      lessons,
      completedBy: currentUser?.id,
    });

    onSubmit?.(summary);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    if (rating >= 2) return 'text-orange-600';
    if (rating > 0) return 'text-red-600';
    return 'text-slate-400';
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4) return 'bg-green-50 border-green-100';
    if (rating >= 3) return 'bg-yellow-50 border-yellow-100';
    if (rating >= 2) return 'bg-orange-50 border-orange-100';
    if (rating > 0) return 'bg-red-50 border-red-100';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">复盘总结</h3>
            <p className="text-xs text-slate-500">系统梳理经验教训，持续提升应对能力</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto scroll-thin">
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <StarIcon />
              </div>
              <div>
                <span className="text-xs text-slate-500">综合评分</span>
                <p className="text-lg font-bold text-slate-800">
                  {overallRating > 0 ? overallRating.toFixed(1) : '—'}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 5.0</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => {
                const filled = i <= Math.round(overallRating);
                const halfFilled = !filled && i - 0.5 <= overallRating;
                return (
                  <svg
                    key={i}
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill={filled ? '#F59E0B' : 'none'}
                    stroke={filled || halfFilled ? '#F59E0B' : '#CBD5E1'}
                    strokeWidth={1.5}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                );
              })}
            </div>
          </div>
          <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                overallRating >= 4
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : overallRating >= 3
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                  : overallRating >= 2
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                  : 'bg-gradient-to-r from-red-400 to-red-500'
              )}
              style={{ width: `${(overallRating / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ratingItems.map((item) => {
            const value =
              item.key === 'responseTime'
                ? responseTime
                : item.key === 'communication'
                ? communication
                : execution;
            return (
              <div
                key={item.key}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all duration-200',
                  getRatingBg(value),
                  value > 0 ? 'shadow-sm' : ''
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      value > 0 ? 'bg-white shadow-sm' : 'bg-white/50'
                    )}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{item.label}</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">{item.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <RatingStars
                    value={value}
                    onChange={handleRatingChange(item.key)}
                    className={cn(value > 0 && getRatingColor(value))}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-green-800 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              应对得当之处
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="请列举本次事件应对中做得好的方面，如：响应及时、措施有力、沟通充分等..."
              rows={4}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none bg-white',
                strengths
                  ? 'border-green-200 focus:ring-green-300'
                  : 'border-slate-200 focus:ring-green-200'
              )}
            />
            <p className="text-[10px] text-green-600 mt-1">
              {strengths.length}/500 字符
            </p>
          </div>

          <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              不足之处
            </label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="请客观分析本次事件应对中的短板和问题，如：预警滞后、协调不畅、措施不到位等..."
              rows={4}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none bg-white',
                weaknesses
                  ? 'border-red-200 focus:ring-red-300'
                  : 'border-slate-200 focus:ring-red-200'
              )}
            />
            <p className="text-[10px] text-red-600 mt-1">
              {weaknesses.length}/500 字符
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
              <Target className="w-4 h-4 text-primary-500" />
              根本原因分析
            </label>
            <textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="深入分析事件发生的深层原因，可从制度、流程、技术、人员等多维度分析，避免表面化..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              改进建议
            </label>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="针对上述问题，提出具体可落地的改进建议，包括但不限于：制度完善、流程优化、技术升级、培训加强等..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            经验教训
            <span className="text-xs text-slate-400 font-normal">
              (提炼可复用的经验，用于知识库)
            </span>
          </label>
          <TagInput
            value={lessons}
            onChange={setLessons}
            suggestions={LESSON_SUGGESTIONS}
            placeholder="输入经验教训关键词，回车添加"
          />
          {lessons.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-xs text-purple-700 font-medium mb-1">
                已添加 {lessons.length} 条经验教训
              </p>
              <p className="text-[10px] text-purple-600">
                这些经验将自动同步到知识库中，供后续类似事件参考
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
        <div className="text-xs text-slate-500">
          {!isFormValid && (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="w-3.5 h-3.5" />
              请完成所有必填项后提交
            </span>
          )}
          {isFormValid && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              表单已填写完整，可提交
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            leftIcon={<Save className="w-4 h-4" />}
            disabled={!isFormValid}
          >
            提交复盘
          </Button>
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
