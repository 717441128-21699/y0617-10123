import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Save, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import { getPlatformLabel } from '@/utils/status';
import { formatNumber } from '@/utils/format';
import { useUserStore } from '@/store/userStore';
import { useKnowledgeStore } from '@/store/knowledgeStore';
import type { PlatformType, SentimentRecord } from '@/types';

const ALL_PLATFORMS: PlatformType[] = [
  'weibo',
  'wechat',
  'douyin',
  'xiaohongshu',
  'zhihu',
  'baidu',
  'media',
  'other',
];

interface SentimentFormProps {
  eventId: string;
  onSubmit?: (record: SentimentRecord) => void;
  onCancel: () => void;
  className?: string;
}

interface PlatformInput {
  platform: PlatformType;
  count: number;
}

export default function SentimentForm({
  eventId,
  onSubmit,
  onCancel,
  className,
}: SentimentFormProps) {
  const { currentUser } = useUserStore();
  const { addSentimentRecord } = useKnowledgeStore();

  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [recordedAt, setRecordedAt] = useState<string>(localNow);
  const [mentionCount, setMentionCount] = useState<string>('');
  const [negativeCount, setNegativeCount] = useState<string>('');
  const [neutralCount, setNeutralCount] = useState<string>('');
  const [positiveCount, setPositiveCount] = useState<string>('');
  const [showPlatformBreakdown, setShowPlatformBreakdown] = useState(false);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformInput[]>(
    ALL_PLATFORMS.map((p) => ({ platform: p, count: 0 }))
  );
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSentiment =
    Number(negativeCount || 0) + Number(neutralCount || 0) + Number(positiveCount || 0);
  const totalPlatform = platformBreakdown.reduce((sum, p) => sum + (p.count || 0), 0);
  const mentionNum = Number(mentionCount || 0);

  const sentimentWarning = totalSentiment > 0 && totalSentiment !== mentionNum;
  const platformWarning =
    totalPlatform > 0 && Math.abs(totalPlatform - mentionNum) / mentionNum > 0.1;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!mentionCount.trim() || Number(mentionCount) <= 0) {
      newErrors.mentionCount = '请输入有效的总提及量';
    }
    if (!recordedAt) {
      newErrors.recordedAt = '请选择记录时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const record = addSentimentRecord({
      eventId,
      recordedAt: new Date(recordedAt).toISOString(),
      mentionCount: Number(mentionCount),
      negativeCount: Number(negativeCount || 0),
      neutralCount: Number(neutralCount || 0),
      positiveCount: Number(positiveCount || 0),
      platformBreakdown: platformBreakdown
        .filter((p) => p.count > 0)
        .map((p) => ({ platform: p.platform, count: p.count })),
      recordedBy: currentUser?.id,
      note: note.trim() || undefined,
    });

    onSubmit?.(record);
    handleReset();
  };

  const handleReset = () => {
    setMentionCount('');
    setNegativeCount('');
    setNeutralCount('');
    setPositiveCount('');
    setNote('');
    setPlatformBreakdown(ALL_PLATFORMS.map((p) => ({ platform: p, count: 0 })));
    setErrors({});
  };

  const handlePlatformChange = (platform: PlatformType, value: string) => {
    setPlatformBreakdown((prev) =>
      prev.map((p) =>
        p.platform === platform ? { ...p, count: Math.max(0, Number(value || 0)) } : p
      )
    );
  };

  const autoFillFromPlatform = () => {
    const total = platformBreakdown.reduce((sum, p) => sum + (p.count || 0), 0);
    if (total > 0) {
      setMentionCount(total.toString());
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">录入舆情数据</h3>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scroll-thin">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            记录时间 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className={cn(
                'w-full pl-10 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.recordedAt ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
              )}
            />
          </div>
          {errors.recordedAt && (
            <p className="mt-1 text-xs text-red-500">{errors.recordedAt}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            总提及量 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={mentionCount}
            onChange={(e) => setMentionCount(e.target.value)}
            placeholder="请输入总提及量"
            className={cn(
              'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
              errors.mentionCount ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
            )}
          />
          {mentionNum > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              约 {formatNumber(mentionNum)} 条
            </p>
          )}
          {errors.mentionCount && (
            <p className="mt-1 text-xs text-red-500">{errors.mentionCount}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <span className="text-red-500 mr-1">●</span>
              负面提及
            </label>
            <input
              type="number"
              min="0"
              value={negativeCount}
              onChange={(e) => setNegativeCount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <span className="text-slate-400 mr-1">●</span>
              中性提及
            </label>
            <input
              type="number"
              min="0"
              value={neutralCount}
              onChange={(e) => setNeutralCount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <span className="text-green-500 mr-1">●</span>
              正面提及
            </label>
            <input
              type="number"
              min="0"
              value={positiveCount}
              onChange={(e) => setPositiveCount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        {sentimentWarning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-700">
              情感分类合计 ({formatNumber(totalSentiment)}) 与总提及量 ({formatNumber(mentionNum)}) 不一致，请核对数据
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPlatformBreakdown(!showPlatformBreakdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="text-xs font-medium text-slate-600">
              各平台分解
              {totalPlatform > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 text-[10px]">
                  已填写 {platformBreakdown.filter((p) => p.count > 0).length} 项
                </span>
              )}
            </span>
            {showPlatformBreakdown ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showPlatformBreakdown && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  合计: {formatNumber(totalPlatform)} 条
                </p>
                <button
                  type="button"
                  onClick={autoFillFromPlatform}
                  className="text-xs text-primary-600 hover:text-primary-700 underline"
                  disabled={totalPlatform === 0}
                >
                  自动填充总提及量
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ALL_PLATFORMS.map((platform) => (
                  <div key={platform}>
                    <label className="block text-xs text-slate-500 mb-1">
                      {getPlatformLabel(platform)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={platformBreakdown.find((p) => p.platform === platform)?.count || ''}
                      onChange={(e) => handlePlatformChange(platform, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}
              </div>
              {platformWarning && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-700">
                    平台合计与总提及量差异较大，请确认数据准确性
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            备注说明
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="补充说明舆情特征、特殊事件等信息..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          leftIcon={<Save className="w-4 h-4" />}
          disabled={!mentionCount.trim() || Number(mentionCount) <= 0}
        >
          保存记录
        </Button>
      </div>
    </div>
  );
}
