import { create } from 'zustand';
import type { CrisisEvent, EventFilters, EventStatus, SeverityLevel, StatusHistoryItem } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { mockEvents } from '../data/mockEvents';

const generateEventId = (): string => {
  return `e${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const getMonthlyTrend = (events: CrisisEvent[]) => {
  const result: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
    const count = events.filter((e) => {
      const t = new Date(e.reportedAt).getTime();
      return t >= monthStart && t <= monthEnd;
    }).length;
    result.push({ month: monthKey, count });
  }
  return result;
};

interface EventStore {
  events: CrisisEvent[];
  selectedEventId: string | null;
  filters: EventFilters;
  filteredEvents: CrisisEvent[];
  getEventById: (id: string) => CrisisEvent | undefined;
  activeEvents: CrisisEvent[];
  highRiskEvents: CrisisEvent[];
  eventsStatusCounts: Record<EventStatus, number>;
  monthlyTrendData: { month: string; count: number }[];
  initEvents: () => void;
  addEvent: (eventData: Partial<CrisisEvent>) => CrisisEvent;
  updateEvent: (id: string, updates: Partial<CrisisEvent>) => void;
  updateEventStatus: (id: string, newStatus: EventStatus, note?: string) => void;
  deleteEvent: (id: string) => void;
  setSelectedEventId: (id: string | null) => void;
  setFilters: (filters: Partial<EventFilters>) => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: storage.get<CrisisEvent[]>(STORAGE_KEYS.EVENTS, []),
  selectedEventId: storage.get<string | null>(STORAGE_KEYS.SELECTED_EVENT_ID, null),
  filters: storage.get<EventFilters>(STORAGE_KEYS.EVENT_FILTERS, {}),

  get filteredEvents() {
    const { events, filters } = get();
    return events.filter((e) => {
      if (filters.status && e.status !== filters.status) return false;
      if (filters.severity && e.severity !== filters.severity) return false;
      if (filters.category && e.category !== filters.category) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const match =
          e.title.toLowerCase().includes(kw) ||
          e.description.toLowerCase().includes(kw) ||
          e.tags.some((t) => t.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  },

  getEventById: (id: string) => {
    return get().events.find((e) => e.id === id);
  },

  get activeEvents() {
    return get().events.filter((e) => e.status !== 'archived');
  },

  get highRiskEvents() {
    return get().events.filter((e) => e.severity >= 4 && e.status !== 'archived');
  },

  get eventsStatusCounts() {
    const counts: Record<EventStatus, number> = {
      pending: 0,
      responding: 0,
      processing: 0,
      monitoring: 0,
      resolved: 0,
      archived: 0,
    };
    get().events.forEach((e) => {
      counts[e.status]++;
    });
    return counts;
  },

  get monthlyTrendData() {
    return getMonthlyTrend(get().events);
  },

  initEvents: () => {
    const stored = storage.get<CrisisEvent[]>(STORAGE_KEYS.EVENTS, []);
    if (stored.length === 0) {
      storage.set(STORAGE_KEYS.EVENTS, mockEvents);
      set({ events: mockEvents });
    } else {
      set({ events: stored });
    }
  },

  addEvent: (eventData: Partial<CrisisEvent>) => {
    const now = new Date().toISOString();
    const id = generateEventId();
    const currentUser = 'u001';
    const initialStatus: EventStatus = eventData.status || 'pending';

    const statusHistory: StatusHistoryItem[] = [
      {
        status: initialStatus,
        changedAt: now,
        changedBy: currentUser,
        note: '事件创建',
      },
    ];

    const newEvent: CrisisEvent = {
      id,
      title: eventData.title || '未命名事件',
      description: eventData.description || '',
      cause: eventData.cause || '待调查',
      discoveredAt: eventData.discoveredAt || now,
      reportedAt: now,
      platforms: eventData.platforms || [],
      initialReach: eventData.initialReach || 0,
      severity: (eventData.severity as SeverityLevel) || 1,
      status: initialStatus,
      statusHistory,
      tags: eventData.tags || [],
      category: eventData.category || '其他',
      createdBy: currentUser,
      assignees: eventData.assignees || [currentUser],
      currentReach: eventData.initialReach,
      peakReach: eventData.initialReach,
    };

    set((state) => ({ events: [...state.events, newEvent] }));
    return newEvent;
  },

  updateEvent: (id: string, updates: Partial<CrisisEvent>) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  updateEventStatus: (id: string, newStatus: EventStatus, note?: string) => {
    const now = new Date().toISOString();
    const currentUser = 'u001';

    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== id) return e;
        const historyItem: StatusHistoryItem = {
          status: newStatus,
          changedAt: now,
          changedBy: currentUser,
          note,
        };
        const updated: CrisisEvent = {
          ...e,
          status: newStatus,
          statusHistory: [...e.statusHistory, historyItem],
        };
        if (newStatus === 'resolved' && !updated.resolvedAt) {
          updated.resolvedAt = now;
        }
        if (newStatus === 'archived' && !updated.archivedAt) {
          updated.archivedAt = now;
        }
        return updated;
      }),
    }));
  },

  deleteEvent: (id: string) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
    }));
  },

  setSelectedEventId: (id: string | null) => {
    set({ selectedEventId: id });
    storage.set(STORAGE_KEYS.SELECTED_EVENT_ID, id);
  },

  setFilters: (filters: Partial<EventFilters>) => {
    set((state) => {
      const newFilters = { ...state.filters, ...filters };
      storage.set(STORAGE_KEYS.EVENT_FILTERS, newFilters);
      return { filters: newFilters };
    });
  },
}));

useEventStore.subscribe((state) => {
  storage.set(STORAGE_KEYS.EVENTS, state.events);
  storage.set(STORAGE_KEYS.SELECTED_EVENT_ID, state.selectedEventId);
  storage.set(STORAGE_KEYS.EVENT_FILTERS, state.filters);
});
