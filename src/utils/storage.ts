const PREFIX = 'crisis_mgmt_';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const fullKey = `${PREFIX}${key}`;
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      const fullKey = `${PREFIX}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
    }
  },

  remove(key: string): void {
    try {
      const fullKey = `${PREFIX}${key}`;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
    }
  },

  clear(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};

export const STORAGE_KEYS = {
  USERS: 'users',
  CURRENT_USER_ID: 'currentUserId',
  EVENTS: 'events',
  SELECTED_EVENT_ID: 'selectedEventId',
  EVENT_FILTERS: 'eventFilters',
  TASKS: 'tasks',
  DOCS: 'docs',
  KNOWLEDGE: 'knowledge',
  SENTIMENT_RECORDS: 'sentimentRecords',
  TIMELINE_EVENTS: 'timelineEvents',
  REVIEW_SUMMARIES: 'reviewSummaries',
} as const;
