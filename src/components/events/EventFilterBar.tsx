import { useState } from 'react';
import { Search, LayoutGrid, List, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEventStatusConfig, getSeverityConfig } from '@/utils/status';
import type { EventFilters, EventStatus, SeverityLevel } from '@/types';

interface EventFilterBarProps {
  filters: EventFilters;
  onFilterChange: (filters: Partial<EventFilters>) => void;
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
  className?: string;
}

const STATUS_OPTIONS: (EventStatus | 'all')[] = [
  'all',
  'pending',
  'responding',
  'processing',
  'monitoring',
  'resolved',
  'archived',
];

const SEVERITY_OPTIONS: (SeverityLevel | 'all')[] = ['all', 1, 2, 3, 4, 5];

const CATEGORY_OPTIONS = ['全部', '产品', '服务', '人事', '财务', '其他'];

interface DropdownProps {
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function Dropdown({ value, options, onChange, placeholder, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:border-gray-300 transition-colors"
      >
        <span className={cn(!selected && 'text-gray-400')}>{selected?.label || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                  value === opt.value
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function EventFilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  className,
}: EventFilterBarProps) {
  const hasActiveFilters =
    filters.keyword || filters.status || filters.severity || (filters.category && filters.category !== '全部');

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索事件标题、描述或标签..."
            value={filters.keyword || ''}
            onChange={(e) => onFilterChange({ keyword: e.target.value })}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => onFilterChange({ keyword: undefined })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Dropdown
          value={filters.status || 'all'}
          placeholder="全部状态"
          className="w-32"
          options={STATUS_OPTIONS.map((s) => ({
            value: s,
            label: s === 'all' ? '全部状态' : getEventStatusConfig(s).label,
            icon:
              s !== 'all' ? (
                <span
                  className={cn('h-2 w-2 rounded-full', getEventStatusConfig(s as EventStatus).dotColor)}
                />
              ) : undefined,
          }))}
          onChange={(v) => onFilterChange({ status: v === 'all' ? undefined : (v as EventStatus) })}
        />

        <Dropdown
          value={String(filters.severity || 'all')}
          placeholder="全部严重度"
          className="w-32"
          options={SEVERITY_OPTIONS.map((s) => ({
            value: String(s),
            label: s === 'all' ? '全部严重度' : `${s}级 - ${getSeverityConfig(s).label}`,
          }))}
          onChange={(v) =>
            onFilterChange({
              severity: v === 'all' ? undefined : (Number(v) as SeverityLevel),
            })
          }
        />

        <Dropdown
          value={filters.category || '全部'}
          placeholder="全部类别"
          className="w-28"
          options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
          onChange={(v) => onFilterChange({ category: v === '全部' ? undefined : v })}
        />

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('card')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              viewMode === 'card'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            )}
            title="卡片视图"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              viewMode === 'table'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            )}
            title="表格视图"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">当前筛选：</span>
          {filters.keyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              关键词: {filters.keyword}
              <button
                onClick={() => onFilterChange({ keyword: undefined })}
                className="rounded-full p-0.5 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              状态: {getEventStatusConfig(filters.status).label}
              <button
                onClick={() => onFilterChange({ status: undefined })}
                className="rounded-full p-0.5 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.severity && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              严重度: {filters.severity}级
              <button
                onClick={() => onFilterChange({ severity: undefined })}
                className="rounded-full p-0.5 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && filters.category !== '全部' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              类别: {filters.category}
              <button
                onClick={() => onFilterChange({ category: undefined })}
                className="rounded-full p-0.5 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                keyword: undefined,
                status: undefined,
                severity: undefined,
                category: undefined,
              })
            }
            className="ml-2 text-blue-600 hover:text-blue-700 hover:underline"
          >
            清除全部
          </button>
        </div>
      )}
    </div>
  );
}
