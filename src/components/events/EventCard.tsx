import { Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventStatusBadge from './EventStatusBadge';
import SeverityIndicator from './SeverityIndicator';
import { truncateText, formatReach, getInitials } from '@/utils/format';
import { formatRelative } from '@/utils/date';
import { getPlatformLabel, getSeverityConfig } from '@/utils/status';
import { useUserStore } from '@/store/userStore';
import type { CrisisEvent } from '@/types';

interface EventCardProps {
  event: CrisisEvent;
  onClick?: () => void;
  className?: string;
}

const SEVERITY_BORDER: Record<number, string> = {
  1: 'bg-green-400',
  2: 'bg-green-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

export default function EventCard({ event, onClick, className }: EventCardProps) {
  const { getUserById } = useUserStore();
  const severityConfig = getSeverityConfig(event.severity);
  const borderColor = SEVERITY_BORDER[event.severity];

  const assignees = event.assignees
    .map((id) => getUserById(id))
    .filter(Boolean)
    .slice(0, 4);
  const extraAssignees = event.assignees.length - assignees.length;

  const visiblePlatforms = event.platforms.slice(0, 3);
  const extraPlatforms = event.platforms.length - visiblePlatforms.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer',
        className
      )}
    >
      <div className={cn('absolute inset-x-0 bottom-0 h-1', borderColor)} />

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <EventStatusBadge status={event.status} />
            <SeverityIndicator level={event.severity} />
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600 leading-relaxed">
          {truncateText(event.description, 100)}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelative(event.discoveredAt)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{formatReach(event.currentReach ?? event.initialReach)}</span>
          </div>

          {severityConfig && (
            <span
              className={cn(
                'inline-flex items-center rounded px-1.5 py-0.5 font-medium',
                severityConfig.bgColor,
                severityConfig.textColor
              )}
            >
              {event.category}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {visiblePlatforms.map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {getPlatformLabel(p)}
            </span>
          ))}
          {extraPlatforms > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{extraPlatforms}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex -space-x-2">
            {assignees.map((user, idx) =>
              user ? (
                user.avatar ? (
                  <img
                    key={user.id}
                    src={user.avatar}
                    alt={user.name}
                    className="h-7 w-7 rounded-full border-2 border-white object-cover"
                    style={{ zIndex: assignees.length - idx }}
                  />
                ) : (
                  <div
                    key={user.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-xs font-medium text-white"
                    style={{ zIndex: assignees.length - idx }}
                  >
                    {getInitials(user.name)}
                  </div>
                )
              ) : null
            )}
            {extraAssignees > 0 && (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-600"
                style={{ zIndex: 0 }}
              >
                +{extraAssignees}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600"
              >
                #{tag}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{event.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
