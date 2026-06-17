import { Calendar, BookOpen, Star as StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import SeverityIndicator from '@/components/events/SeverityIndicator';
import { truncateText } from '@/utils/format';
import { formatDate } from '@/utils/date';
import { getSeverityConfig } from '@/utils/status';
import type { SeverityLevel, KnowledgeBaseCase } from '@/types';

type KnowledgeCardItem = Partial<KnowledgeBaseCase> & {
  id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  summary: string;
  archivedAt: string;
  overallRating?: number;
  lessons?: { id: string; title: string; description: string; category: string }[] | string[];
};

interface KnowledgeCardProps {
  item: KnowledgeCardItem;
  onClick?: () => void;
  className?: string;
}

const SEVERITY_GRADIENT: Record<SeverityLevel, string> = {
  1: 'from-blue-400 via-blue-500 to-blue-600',
  2: 'from-green-400 via-green-500 to-green-600',
  3: 'from-yellow-400 via-yellow-500 to-orange-500',
  4: 'from-orange-400 via-orange-500 to-red-500',
  5: 'from-red-500 via-red-600 to-red-700',
};

export default function KnowledgeCard({ item, onClick, className }: KnowledgeCardProps) {
  const severityConfig = getSeverityConfig(item.severity);
  const gradient = SEVERITY_GRADIENT[item.severity];
  const rating = item.overallRating || 0;

  const lessonTags: string[] =
    item.lessons && item.lessons.length > 0
      ? item.lessons
          .map((l) => (typeof l === 'string' ? l : l.title))
          .filter(Boolean)
          .slice(0, 2)
      : [];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary-200 cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r',
          gradient
        )}
      />

      <div className="p-4 pt-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-slate-800 line-clamp-2 flex-1 group-hover:text-primary-600 transition-colors">
            {truncateText(item.title, 15)}
          </h3>
          {rating > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-100 flex-shrink-0">
              <StarIcon className="w-3.5 h-3.5 text-amber-500" fill="#F59E0B" />
              <span className="text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
              severityConfig.bgColor,
              severityConfig.textColor
            )}
          >
            {item.category}
          </span>
          <SeverityIndicator level={item.severity} showLabel />
        </div>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
          {truncateText(item.summary, 50)}
        </p>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>平息日期：{formatDate(item.archivedAt)}</span>
          </div>

          {lessonTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lessonTags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-xs font-medium"
                >
                  <BookOpen className="w-3 h-3" />
                  {truncateText(tag, 8)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
