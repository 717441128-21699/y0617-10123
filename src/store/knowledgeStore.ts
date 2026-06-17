import { create } from 'zustand';
import type { KnowledgeItem, KnowledgeBaseCase, SentimentRecord, TimelineEvent, ReviewSummary } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { mockKnowledge, mockKnowledgeItems } from '../data/mockKnowledge';
import { mockSentiment } from '../data/mockSentiment';

const generateId = (prefix: string): string => {
  return `${prefix}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

interface KnowledgeStore {
  items: KnowledgeItem[];
  cases: KnowledgeBaseCase[];
  sentimentRecords: SentimentRecord[];
  timelineEvents: TimelineEvent[];
  reviewSummaries: ReviewSummary[];
  getKnowledgeById: (id: string) => KnowledgeItem | undefined;
  getCaseById: (id: string) => KnowledgeBaseCase | undefined;
  getCaseByEventId: (eventId: string) => KnowledgeBaseCase | undefined;
  searchKnowledge: (keyword: string) => KnowledgeItem[];
  searchCases: (keyword: string) => KnowledgeBaseCase[];
  getSentimentByEventId: (eventId: string) => SentimentRecord[];
  getTimelineByEventId: (eventId: string) => TimelineEvent[];
  getReviewByEventId: (eventId: string) => ReviewSummary | undefined;
  initAll: () => void;
  addSentimentRecord: (record: Partial<SentimentRecord>) => SentimentRecord;
  addTimelineEvent: (event: Partial<TimelineEvent>) => TimelineEvent;
  addReviewSummary: (summary: Partial<ReviewSummary>) => ReviewSummary;
  addCase: (caseData: Partial<KnowledgeBaseCase>) => KnowledgeBaseCase;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  items: storage.get<KnowledgeItem[]>(STORAGE_KEYS.KNOWLEDGE, []),
  cases: storage.get<KnowledgeBaseCase[]>(STORAGE_KEYS.KNOWLEDGE_CASES, []),
  sentimentRecords: storage.get<SentimentRecord[]>(STORAGE_KEYS.SENTIMENT_RECORDS, []),
  timelineEvents: storage.get<TimelineEvent[]>(STORAGE_KEYS.TIMELINE_EVENTS, []),
  reviewSummaries: storage.get<ReviewSummary[]>(STORAGE_KEYS.REVIEW_SUMMARIES, []),

  getKnowledgeById: (id: string) => {
    return get().items.find((k) => k.id === id);
  },

  getCaseById: (id: string) => {
    return get().cases.find((c) => c.id === id);
  },

  getCaseByEventId: (eventId: string) => {
    return get().cases.find((c) => c.id === `kb_${eventId}` || c.id === eventId);
  },

  searchKnowledge: (keyword: string) => {
    const kw = keyword.toLowerCase().trim();
    if (!kw) return get().items;
    return get().items.filter((k) => {
      return (
        k.title.toLowerCase().includes(kw) ||
        k.summary.toLowerCase().includes(kw) ||
        k.category.toLowerCase().includes(kw) ||
        k.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  },

  searchCases: (keyword: string) => {
    const kw = keyword.toLowerCase().trim();
    if (!kw) return get().cases;
    return get().cases.filter((c) => {
      return (
        c.title.toLowerCase().includes(kw) ||
        c.summary.toLowerCase().includes(kw) ||
        c.description.toLowerCase().includes(kw) ||
        c.category.toLowerCase().includes(kw) ||
        c.lessons.some((l) => l.title.toLowerCase().includes(kw))
      );
    });
  },

  getSentimentByEventId: (eventId: string) => {
    return get()
      .sentimentRecords.filter((r) => r.eventId === eventId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  },

  getTimelineByEventId: (eventId: string) => {
    return get()
      .timelineEvents.filter((t) => t.eventId === eventId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getReviewByEventId: (eventId: string) => {
    return get().reviewSummaries.find((r) => r.eventId === eventId);
  },

  initAll: () => {
    const storedKnowledge = storage.get<KnowledgeItem[]>(STORAGE_KEYS.KNOWLEDGE, []);
    const storedCases = storage.get<KnowledgeBaseCase[]>(STORAGE_KEYS.KNOWLEDGE_CASES, []);
    const storedSentiment = storage.get<SentimentRecord[]>(STORAGE_KEYS.SENTIMENT_RECORDS, []);
    const storedTimeline = storage.get<TimelineEvent[]>(STORAGE_KEYS.TIMELINE_EVENTS, []);
    const storedReview = storage.get<ReviewSummary[]>(STORAGE_KEYS.REVIEW_SUMMARIES, []);

    const mergeById = <T extends { id: string }>(stored: T[], mock: T[]): T[] => {
      if (stored.length === 0) return mock;
      const existingIds = new Set(stored.map((x) => x.id));
      const toAdd = mock.filter((m) => !existingIds.has(m.id));
      return [...stored, ...toAdd];
    };

    const mergedKnowledge = mergeById(storedKnowledge, mockKnowledge);
    if (mergedKnowledge.length !== storedKnowledge.length) {
      storage.set(STORAGE_KEYS.KNOWLEDGE, mergedKnowledge);
    }
    set({ items: mergedKnowledge });

    const mergedCases = mergeById(storedCases, mockKnowledgeItems);
    if (mergedCases.length !== storedCases.length) {
      storage.set(STORAGE_KEYS.KNOWLEDGE_CASES, mergedCases);
    }
    set({ cases: mergedCases });

    const mergedSentiment = mergeById(storedSentiment, mockSentiment);
    if (mergedSentiment.length !== storedSentiment.length) {
      storage.set(STORAGE_KEYS.SENTIMENT_RECORDS, mergedSentiment);
    }
    set({ sentimentRecords: mergedSentiment });

    set({ timelineEvents: storedTimeline });
    set({ reviewSummaries: storedReview });
  },

  addSentimentRecord: (record: Partial<SentimentRecord>) => {
    const now = new Date().toISOString();
    const id = generateId('s');

    const newRecord: SentimentRecord = {
      id,
      eventId: record.eventId || '',
      recordedAt: record.recordedAt || now,
      mentionCount: record.mentionCount || 0,
      negativeCount: record.negativeCount || 0,
      neutralCount: record.neutralCount || 0,
      positiveCount: record.positiveCount || 0,
      platformBreakdown: record.platformBreakdown || [],
      recordedBy: record.recordedBy || 'u001',
      note: record.note,
    };

    set((state) => ({ sentimentRecords: [...state.sentimentRecords, newRecord] }));
    return newRecord;
  },

  addTimelineEvent: (event: Partial<TimelineEvent>) => {
    const now = new Date().toISOString();
    const id = generateId('tl');

    const newEvent: TimelineEvent = {
      id,
      eventId: event.eventId || '',
      timestamp: event.timestamp || now,
      type: event.type || 'note',
      title: event.title || '未命名节点',
      description: event.description || '',
      relatedId: event.relatedId,
      createdBy: event.createdBy || 'u001',
    };

    set((state) => ({ timelineEvents: [...state.timelineEvents, newEvent] }));
    return newEvent;
  },

  addReviewSummary: (summary: Partial<ReviewSummary>) => {
    const now = new Date().toISOString();
    const id = generateId('r');

    const newSummary: ReviewSummary = {
      id,
      eventId: summary.eventId || '',
      strengths: summary.strengths || '',
      weaknesses: summary.weaknesses || '',
      rootCause: summary.rootCause || '',
      suggestions: summary.suggestions || '',
      responseTime: summary.responseTime || 3,
      communication: summary.communication || 3,
      execution: summary.execution || 3,
      overallRating: summary.overallRating || 3,
      lessons: summary.lessons || [],
      completedBy: summary.completedBy || 'u001',
      completedAt: now,
    };

    set((state) => ({ reviewSummaries: [...state.reviewSummaries, newSummary] }));
    return newSummary;
  },

  addCase: (caseData: Partial<KnowledgeBaseCase>) => {
    const now = new Date().toISOString();
    const id = caseData.id || generateId('kb');

    const newCase: KnowledgeBaseCase = {
      id,
      title: caseData.title || '未命名案例',
      category: caseData.category || '其他',
      severity: caseData.severity || 3,
      startedAt: caseData.startedAt || now,
      resolvedAt: caseData.resolvedAt || now,
      archivedAt: caseData.archivedAt || now,
      description: caseData.description || '',
      summary: caseData.summary || '',
      stakeholders: caseData.stakeholders || [],
      reviewSummary: caseData.reviewSummary || {
        strengths: [],
        weaknesses: [],
        suggestions: [],
        responseTime: 3,
        communication: 3,
        execution: 3,
        overallRating: 3,
      },
      lessons: caseData.lessons || [],
    };

    set((state) => ({ cases: [...state.cases, newCase] }));
    return newCase;
  },
}));

useKnowledgeStore.subscribe((state) => {
  storage.set(STORAGE_KEYS.KNOWLEDGE, state.items);
  storage.set(STORAGE_KEYS.KNOWLEDGE_CASES, state.cases);
  storage.set(STORAGE_KEYS.SENTIMENT_RECORDS, state.sentimentRecords);
  storage.set(STORAGE_KEYS.TIMELINE_EVENTS, state.timelineEvents);
  storage.set(STORAGE_KEYS.REVIEW_SUMMARIES, state.reviewSummaries);
});
