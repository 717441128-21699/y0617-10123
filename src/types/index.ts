export type EventStatus = 'pending' | 'responding' | 'processing' | 'monitoring' | 'resolved' | 'archived';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type PlatformType = 'weibo' | 'wechat' | 'douyin' | 'xiaohongshu' | 'zhihu' | 'baidu' | 'media' | 'other';

export type TaskType = 'legal' | 'customer_service' | 'pr' | 'management' | 'other';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';

export type DocumentType = 'statement' | 'media_reply' | 'internal_report' | 'other';

export type SentimentType = 'negative' | 'neutral' | 'positive';

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type UserRole = 'admin' | 'pr' | 'legal' | 'cs' | 'viewer' | 'management';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email: string;
  department: string;
}

export interface StatusHistoryItem {
  status: EventStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface CrisisEvent {
  id: string;
  title: string;
  description: string;
  cause: string;
  discoveredAt: string;
  reportedAt: string;
  platforms: PlatformType[];
  initialReach: number;
  severity: SeverityLevel;
  status: EventStatus;
  statusHistory: StatusHistoryItem[];
  tags: string[];
  category: string;
  createdBy: string;
  assignees: string[];
  currentReach?: number;
  peakReach?: number;
  resolvedAt?: string;
  archivedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assignorId: string;
  createdAt: string;
  deadline: string;
  completedAt?: string;
  attachments?: string[];
  comments?: TaskComment[];
}

export interface DocVersion {
  version: string;
  content: string;
  createdAt: string;
  createdBy: string;
  changeLog: string;
}

export interface ApprovalRecord {
  id: string;
  docId: string;
  version: string;
  approverId: string;
  status: ApprovalStatus;
  comment: string;
  createdAt: string;
}

export interface CommunicationDoc {
  id: string;
  eventId: string;
  title: string;
  type: DocumentType;
  versions: DocVersion[];
  currentVersion: number;
  approvalStatus: ApprovalStatus;
  approvals: ApprovalRecord[];
  createdAt: string;
  createdBy: string;
}

export interface SentimentRecord {
  id: string;
  eventId: string;
  recordedAt: string;
  mentionCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
  platformBreakdown: { platform: PlatformType; count: number }[];
  recordedBy: string;
  note?: string;
}

export interface TimelineEvent {
  id: string;
  eventId: string;
  timestamp: string;
  type: 'status_change' | 'task' | 'communication' | 'sentiment_update' | 'external' | 'note';
  title: string;
  description: string;
  relatedId?: string;
  createdBy: string;
}

export interface ReviewSummary {
  id: string;
  eventId: string;
  strengths: string;
  weaknesses: string;
  rootCause: string;
  suggestions: string;
  responseTime: number;
  communication: number;
  execution: number;
  overallRating: number;
  lessons: string[];
  completedBy: string;
  completedAt: string;
}

export interface KnowledgeItem {
  id: string;
  eventId: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  severity: SeverityLevel;
  archivedAt: string;
}

export interface EventFilters {
  status?: EventStatus;
  severity?: SeverityLevel;
  keyword?: string;
  category?: string;
}

export interface KnowledgeBaseCase {
  id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  startedAt: string;
  resolvedAt: string;
  archivedAt: string;
  description: string;
  summary: string;
  stakeholders: string[];
  reviewSummary: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    responseTime: number;
    communication: number;
    execution: number;
    overallRating: number;
  };
  lessons: {
    id: string;
    title: string;
    description: string;
    category: string;
  }[];
}
