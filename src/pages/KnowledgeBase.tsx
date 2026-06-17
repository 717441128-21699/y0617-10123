import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  Star,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Filter as FilterIcon,
  Hash,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/common/EmptyState';
import SeverityIndicator from '@/components/events/SeverityIndicator';
import { useKnowledgeStore } from '@/store/knowledgeStore';
import { formatDate, daysBetween } from '@/utils/date';
import { getSeverityConfig } from '@/utils/status';
import { cn } from '@/lib/utils';
import type { KnowledgeBaseCase, SeverityLevel } from '@/types';

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { initAll, cases } = useKnowledgeStore();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);

  useEffect(() => {
    initAll();
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [initAll]);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [cases]);

  const allTags = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((item) => {
      item.lessons.forEach((l) => {
        map[l.category] = (map[l.category] || 0) + 1;
      });
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [cases]);

  const stats = useMemo(() => {
    const totalCases = cases.length;
    const avgRating = totalCases > 0
      ? (cases.reduce((s, i) => s + i.reviewSummary.overallRating, 0) / totalCases).toFixed(1)
      : '0';
    const lessonMap: Record<string, number> = {};
    cases.forEach((item) => {
      item.lessons.forEach((l) => {
        lessonMap[l.category] = (lessonMap[l.category] || 0) + 1;
      });
    });
    const topLesson = Object.entries(lessonMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    return { totalCases, avgRating, topLesson };
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(c.severity)) return false;
      if (search) {
        const kw = search.toLowerCase();
        const match =
          c.title.toLowerCase().includes(kw) ||
          c.summary.toLowerCase().includes(kw) ||
          c.description.toLowerCase().includes(kw) ||
          c.category.toLowerCase().includes(kw) ||
          c.lessons.some((l) => l.title.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [search, selectedCategory, selectedSeverities, cases]);

  const toggleSeverity = (lv: SeverityLevel) => {
    setSelectedSeverities((prev) =>
      prev.includes(lv) ? prev.filter((x) => x !== lv) : [...prev, lv]
    );
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedSeverities.length > 0 || search;

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSeverities([]);
    setSearch('');
  };

  return (
    <PageContainer
      title="知识库"
      subtitle="历史危机案例复盘归档"
      actions={
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索案例、经验教训..."
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
      }
    >
      <div className="grid grid-cols-12 gap-4 h-full" style={{ minHeight: 'calc(100vh - 220px)' }}>
        <aside className="lg:col-span-2 space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                案例分类
              </h4>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedCategory === 'all'
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span>全部案例</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    selectedCategory === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {cases.length}
                  </span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedCategory === cat.name
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span>{cat.name}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      selectedCategory === cat.name ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                    )}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                严重程度
              </h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((lv) => {
                  const cfg = getSeverityConfig(lv as SeverityLevel);
                  const checked = selectedSeverities.includes(lv as SeverityLevel);
                  return (
                    <label key={lv} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSeverity(lv as SeverityLevel)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/20"
                      />
                      <SeverityIndicator level={lv as SeverityLevel} />
                      <span className={cn('text-xs', cfg.textColor)}>{cfg.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Hash className="w-4 h-4" />
                标签云
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag.name}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors',
                      'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700'
                    )}
                    onClick={() => setSearch(tag.name)}
                  >
                    <span>{tag.name}</span>
                    <span className="text-slate-400">{tag.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">总案例数</p>
                <p className="text-2xl font-serif font-bold text-slate-800">{stats.totalCases}</p>
              </div>
            </div>
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">平均评分</p>
                <p className="text-2xl font-serif font-bold text-slate-800 flex items-baseline gap-1">
                  {stats.avgRating}
                  <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </p>
              </div>
            </div>
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">最高频教训</p>
                <p className="text-base font-serif font-bold text-slate-800 truncate max-w-[160px]">
                  {stats.topLesson}
                </p>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="card p-3 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <FilterIcon className="w-3.5 h-3.5" /> 当前筛选：
              </span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  分类: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="rounded-full p-0.5 hover:bg-slate-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedSeverities.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                  严重度: {selectedSeverities.join('/')}级
                  <button onClick={() => setSelectedSeverities([])} className="rounded-full p-0.5 hover:bg-slate-200">
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
              <span className="ml-auto text-slate-500">匹配 {filteredCases.length} 条结果</span>
              <button onClick={clearFilters} className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
                清除全部
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card h-[280px] animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-12 h-12" />}
              title="暂无匹配的案例"
              description={hasActiveFilters ? '没有符合筛选条件的案例，请尝试调整筛选条件' : '知识库暂无案例'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCases.map((c: KnowledgeBaseCase) => (
                <KnowledgeCard key={c.id} caseItem={c} onClick={() => navigate(`/knowledge/${c.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

interface KnowledgeCardProps {
  caseItem: KnowledgeBaseCase;
  onClick?: () => void;
}

function KnowledgeCard({ caseItem, onClick }: KnowledgeCardProps) {
  const severityCfg = getSeverityConfig(caseItem.severity);
  const duration = daysBetween(caseItem.startedAt, caseItem.resolvedAt);
  const rating = caseItem.reviewSummary.overallRating;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer card'
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', severityCfg.levelColor)} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
            severityCfg.bgColor, severityCfg.textColor
          )}>
            {caseItem.category}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3 h-3',
                  i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                )}
              />
            ))}
          </div>
        </div>

        <h3 className="text-base font-semibold text-slate-800 line-clamp-2 group-hover:text-primary-600 transition-colors mb-2 min-h-[3.5rem]">
          {caseItem.title}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
          {caseItem.summary}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <SeverityIndicator level={caseItem.severity} />
            </span>
            <span>{duration}天</span>
          </div>
          <span>{formatDate(caseItem.archivedAt).slice(0, 7)}</span>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {caseItem.lessons.slice(0, 2).map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600"
            >
              #{l.category}
            </span>
          ))}
          {caseItem.lessons.length > 2 && (
            <span className="text-[10px] text-slate-400">+{caseItem.lessons.length - 2}教训</span>
          )}
        </div>
      </div>
    </div>
  );
}
