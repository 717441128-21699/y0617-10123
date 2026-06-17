import { History, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import { formatDateTime } from '@/utils/date';
import { useUserStore } from '@/store/userStore';
import type { DocVersion, User as UserType } from '@/types';

interface VersionHistoryProps {
  versions: DocVersion[];
  currentVersion: string;
  onSelectVersion?: (version: DocVersion) => void;
  users?: UserType[];
  className?: string;
}

export default function VersionHistory({
  versions,
  currentVersion,
  onSelectVersion,
  users: externalUsers,
  className,
}: VersionHistoryProps) {
  const { getUserById } = useUserStore();
  const externalUserMap = externalUsers?.reduce((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {} as Record<string, UserType>);

  const sortedVersions = [...versions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <History className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800">版本历史</h3>
        <span className="ml-auto text-xs text-slate-400">共 {versions.length} 个版本</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-thin">
        {sortedVersions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
            <History className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-xs">暂无历史版本</p>
          </div>
        ) : (
          sortedVersions.map((version, idx) => {
            const creator = externalUserMap?.[version.createdBy] || getUserById(version.createdBy);
            const isCurrent = version.version === currentVersion;

            return (
              <div
                key={`${version.version}-${idx}`}
                onClick={() => onSelectVersion?.(version)}
                className={cn(
                  'group p-3 rounded-lg border cursor-pointer transition-all duration-200',
                  isCurrent
                    ? 'border-primary-300 bg-primary-50 shadow-sm ring-1 ring-primary-200'
                    : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-bold',
                        isCurrent
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700'
                      )}
                    >
                      V{version.version}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-100 text-primary-700 font-medium">
                        当前版本
                      </span>
                    )}
                  </div>
                </div>

                {version.changeLog && (
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                    {version.changeLog}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      src={creator?.avatar}
                      name={creator?.name || '未知'}
                      size="xs"
                    />
                    <span className="text-xs text-slate-500">
                      {creator?.name || '未知用户'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(version.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
