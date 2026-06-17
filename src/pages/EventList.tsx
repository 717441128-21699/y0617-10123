import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import EventCard from '@/components/events/EventCard';
import EventFilterBar from '@/components/events/EventFilterBar';
import EventForm from '@/components/events/EventForm';
import EventStatusBadge from '@/components/events/EventStatusBadge';
import SeverityIndicator from '@/components/events/SeverityIndicator';
import { useEventStore } from '@/store/eventStore';
import { useUserStore } from '@/store/userStore';
import { formatDateTime, formatRelative } from '@/utils/date';
import { formatReach, getInitials } from '@/utils/format';
import { getPlatformLabel } from '@/utils/status';
import { cn } from '@/lib/utils';
import type { CrisisEvent, User } from '@/types';

export default function EventList() {
  const navigate = useNavigate();
  const { events, filteredEvents, filters, setFilters, addEvent, initEvents } = useEventStore();
  const { users, initUsers, getUserById } = useUserStore();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(12);

  useEffect(() => {
    initUsers();
    initEvents();
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [initUsers, initEvents]);

  const displayedEvents = filteredEvents.slice(0, displayCount);
  const hasMore = displayCount < filteredEvents.length;

  const handleCreateEvent = (data: Partial<CrisisEvent>) => {
    const newEvent = addEvent(data);
    setShowCreateModal(false);
    navigate(`/events/${newEvent.id}`);
  };

  const handleEventClick = (id: string) => {
    navigate(`/events/${id}`);
  };

  const renderCardView = () => {
    if (filteredEvents.length === 0) {
      return (
        <EmptyState
          title="暂无事件"
          description={
            Object.keys(filters).length > 0
              ? '没有符合筛选条件的事件，请尝试调整筛选条件'
              : '点击右上角"新建事件"按钮创建第一个危机事件'
          }
          action={
            Object.keys(filters).length === 0 && (
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                新建事件
              </Button>
            )
          }
        />
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card h-[220px] animate-pulse bg-slate-100" />
              ))
            : displayedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="secondary"
              onClick={() => setDisplayCount((c) => c + 12)}
            >
              加载更多 ({filteredEvents.length - displayCount} 条剩余)
            </Button>
          </div>
        )}
      </>
    );
  };

  const renderTableView = () => {
    if (filteredEvents.length === 0) {
      return (
        <EmptyState
          title="暂无事件"
          description={
            Object.keys(filters).length > 0
              ? '没有符合筛选条件的事件，请尝试调整筛选条件'
              : '点击右上角"新建事件"按钮创建第一个危机事件'
          }
        />
      );
    }

    return (
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">状态</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">严重度</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap min-w-[240px]">标题</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">分类</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">平台</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">传播量</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">发现时间</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">成员</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : displayedEvents.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <EventStatusBadge status={event.status} />
                      </td>
                      <td className="px-4 py-3">
                        <SeverityIndicator level={event.severity} showLabel />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 line-clamp-1">{event.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{event.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600">{event.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {event.platforms.slice(0, 2).map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                            >
                              {getPlatformLabel(p)}
                            </span>
                          ))}
                          {event.platforms.length > 2 && (
                            <span className="text-xs text-slate-400">+{event.platforms.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {formatReach(event.currentReach ?? event.initialReach)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-500 text-xs whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          <span title={formatDateTime(event.discoveredAt)}>
                            {formatRelative(event.discoveredAt)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex -space-x-2">
                          {event.assignees.slice(0, 3).map((uid) => {
                            const user = getUserById(uid);
                            if (!user) return null;
                            return user.avatar ? (
                              <img
                                key={uid}
                                src={user.avatar}
                                alt={user.name}
                                className="h-7 w-7 rounded-full border-2 border-white object-cover"
                              />
                            ) : (
                              <div
                                key={uid}
                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-xs font-medium text-white"
                              >
                                {getInitials(user.name)}
                              </div>
                            );
                          })}
                          {event.assignees.length > 3 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600">
                              +{event.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="flex justify-center py-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setDisplayCount((c) => c + 20)}
            >
              加载更多 ({filteredEvents.length - displayCount} 条剩余)
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageContainer
      title="事件管理"
      subtitle={`共 ${events.length} 个事件，${filteredEvents.length} 个匹配筛选条件`}
      actions={
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          新建事件
        </Button>
      }
    >
      <div className="space-y-4">
        <EventFilterBar
          filters={filters}
          onFilterChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === 'card' ? renderCardView() : renderTableView()}
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建危机事件"
        maxWidth="lg"
      >
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </PageContainer>
  );
}
