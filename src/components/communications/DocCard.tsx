import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import DocTypeBadge from './DocTypeBadge';
import ApprovalBadge from './ApprovalBadge';
import { truncateText } from '@/utils/format';
import { formatRelative } from '@/utils/date';
import { useUserStore } from '@/store/userStore';
import type { CommunicationDoc, User } from '@/types';

interface DocCardProps {
  doc: CommunicationDoc;
  onClick?: () => void;
  users?: User[];
  className?: string;
}

export default function DocCard({ doc, onClick, users: externalUsers, className }: DocCardProps) {
  const { getUserById } = useUserStore();
  const creator = getUserById(doc.createdBy);
  const externalUserMap = externalUsers?.reduce((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {} as Record<string, User>);
  const finalCreator = externalUserMap?.[doc.createdBy] || creator;

  const latestVersion = doc.versions[doc.versions.length - 1];
  const versionCount = doc.versions.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <DocTypeBadge type={doc.type} />
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 flex-1 group-hover:text-primary-600 transition-colors">
            {truncateText(doc.title, 20)}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs">
          <ApprovalBadge status={doc.approvalStatus} />
          <div className="flex items-center gap-1 text-slate-500">
            <Layers className="w-3.5 h-3.5" />
            <span>
              V{doc.currentVersion}
              {latestVersion && `.${latestVersion.version.split('.')[1] || '0'}`}
            </span>
            <span className="text-slate-400">({versionCount}个版本)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={finalCreator?.avatar}
            name={finalCreator?.name || '未知'}
            size="xs"
          />
          <span className="text-xs text-slate-600 font-medium">
            {finalCreator?.name || '未知用户'}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400">{formatRelative(doc.createdAt)}</span>
        </div>

        {latestVersion && latestVersion.changeLog && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 line-clamp-2">
              <span className="text-slate-400">变更：</span>
              {truncateText(latestVersion.changeLog, 50)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
