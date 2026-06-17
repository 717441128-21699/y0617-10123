import { useState } from 'react';
import { Plus, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import DocCard from './DocCard';
import DocTypeBadge from './DocTypeBadge';
import ApprovalBadge from './ApprovalBadge';
import EmptyState from '@/components/common/EmptyState';
import type { CommunicationDoc, DocumentType, User } from '@/types';

type FilterType = 'all' | DocumentType;

interface DocListProps {
  docs: CommunicationDoc[];
  users?: User[];
  onDocClick?: (doc: CommunicationDoc) => void;
  onNewDoc?: () => void;
  className?: string;
}

const filterTabs: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'statement', label: '声明' },
  { key: 'media_reply', label: '媒体回复' },
  { key: 'internal_report', label: '内部汇报' },
];

export default function DocList({
  docs,
  users,
  onDocClick,
  onNewDoc,
  className,
}: DocListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocs = docs.filter((doc) => {
    if (activeFilter === 'all') return true;
    return doc.type === activeFilter;
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {filterTabs.map((tab) => {
            const count =
              tab.key === 'all'
                ? docs.length
                : docs.filter((d) => d.type === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                  activeFilter === tab.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded text-[10px]',
                    activeFilter === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              title="网格视图"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNewDoc}>
            新建文档
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 scroll-thin">
        {filteredDocs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title="暂无文档"
              description={
                activeFilter === 'all'
                  ? '点击右上角"新建文档"开始创建'
                  : '当前筛选条件下没有文档'
              }
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                users={users}
                onClick={() => onDocClick?.(doc)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredDocs.map((doc) => {
              const latestVersion = doc.versions[doc.versions.length - 1];
              return (
                <div
                  key={doc.id}
                  onClick={() => onDocClick?.(doc)}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <DocTypeBadge type={doc.type} />
                      <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                        {doc.title}
                      </h3>
                    </div>
                    {latestVersion && (
                      <p className="text-xs text-slate-500 truncate">
                        {latestVersion.changeLog}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-xs text-slate-500">
                      <div>版本：V{doc.currentVersion}</div>
                      <div>{doc.versions.length} 个历史版本</div>
                    </div>
                    <ApprovalBadge status={doc.approvalStatus} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
