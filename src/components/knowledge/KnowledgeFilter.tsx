import { Search, Filter, ArrowUpDown, Calendar, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSeverityConfig } from '@/utils/status';
import type { SeverityLevel } from '@/types';

export interface KnowledgeFilters {
  keyword?: string;
  category?: string;
  severity?: SeverityLevel;
  timeRange?: '3months' | '6months' | '1year' | 'all';
  sortBy?: 'rating' | 'time';
  sortOrder?: 'asc' | 'desc';
}

interface KnowledgeFilterProps {
  filters: KnowledgeFilters;
  onFilterChange: (filters: KnowledgeFilters) => void;
  categories?: string[];
  className?: string;
}

const TIME_RANGES = [
  { key: '3months' as const, label: '近3月' },
  { key: '6months' as const, label: '近6月' },
  { key: '1year' as const, label: '近1年' },
  { key: 'all' as const, label: '全部' },
];

const SEVERITY_LEVELS: { level: SeverityLevel; label: string }[] = [
  { level: 1, label: '轻微' },
  { level: 2, label: '一般' },
  { level: 3, label: '中等' },
  { level: 4, label: '严重' },
  { level: 5, label: '特别重大' },
];

const DEFAULT_CATEGORIES = [
  '法律合规',
  '供应链风险',
  '数据安全',
  '产品质量',
  '品牌声誉',
  '财务风险',
  '运营管理',
  '员工关系',
];

export default function KnowledgeFilter({
  filters,
  onFilterChange,
  categories,
  className,
}: KnowledgeFilterProps) {
  const availableCategories = categories || DEFAULT_CATEGORIES;

  const handleChange = <K extends keyof KnowledgeFilters>(
    key: K,
    value: KnowledgeFilters[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      keyword: '',
      category: undefined,
      severity: undefined,
      timeRange: 'all',
      sortBy: 'time',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters =
    filters.keyword ||
    filters.category ||
    filters.severity ||
    (filters.timeRange && filters.timeRange !== 'all');

  const toggleSortOrder = () => {
    handleChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">筛选条件</h4>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={(e) => handleChange('keyword', e.target.value)}
            placeholder="搜索案例标题、摘要、标签..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {filters.keyword && (
            <button
              onClick={() => handleChange('keyword', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
              <Filter className="w-3.5 h-3.5" />
              分类筛选
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) =>
                handleChange('category', e.target.value || undefined)
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white appearance-none cursor-pointer"
            >
              <option value="">全部分类</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              时间范围
            </label>
            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              {TIME_RANGES.map((range) => {
                const isActive = (filters.timeRange || 'all') === range.key;
                return (
                  <button
                    key={range.key}
                    onClick={() => handleChange('timeRange', range.key)}
                    className={cn(
                      'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            严重程度
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleChange('severity', undefined)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200',
                !filters.severity
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              全部
            </button>
            {SEVERITY_LEVELS.map(({ level, label }) => {
              const config = getSeverityConfig(level);
              const isActive = filters.severity === level;
              return (
                <button
                  key={level}
                  onClick={() => handleChange('severity', level)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200',
                    isActive
                      ? `${config.bgColor} ${config.textColor} border-transparent shadow-sm`
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        level === 1
                          ? 'bg-blue-500'
                          : level === 2
                          ? 'bg-green-500'
                          : level === 3
                          ? 'bg-yellow-500'
                          : level === 4
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      )}
                    />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            排序方式
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-slate-100 rounded-lg flex-1">
              <button
                onClick={() => handleChange('sortBy', 'time')}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                  (filters.sortBy || 'time') === 'time'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                按时间
              </button>
              <button
                onClick={() => handleChange('sortBy', 'rating')}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                  filters.sortBy === 'rating'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                按评分
              </button>
            </div>
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              title={filters.sortOrder === 'desc' ? '降序' : '升序'}
            >
              <ArrowUpDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  filters.sortOrder === 'asc' && 'rotate-180'
                )}
              />
              {filters.sortOrder === 'desc' ? '降序' : '升序'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
