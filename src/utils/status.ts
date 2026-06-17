import {
  EventStatus,
  SeverityLevel,
  TaskStatus,
  TaskPriority,
  TaskType,
  PlatformType,
  DocumentType,
  ApprovalStatus,
  UserRole,
  SentimentType,
} from '../types';

interface EventStatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}

export const getEventStatusConfig = (status: EventStatus): EventStatusConfig => {
  const configs: Record<EventStatus, EventStatusConfig> = {
    pending: {
      label: '待处理',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      dotColor: 'bg-gray-500',
    },
    responding: {
      label: '响应中',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      dotColor: 'bg-orange-500',
    },
    processing: {
      label: '处理中',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      dotColor: 'bg-blue-500',
    },
    monitoring: {
      label: '监测中',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      dotColor: 'bg-yellow-500',
    },
    resolved: {
      label: '已解决',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      dotColor: 'bg-green-500',
    },
    archived: {
      label: '已归档',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
      dotColor: 'bg-slate-500',
    },
  };
  return configs[status];
};

interface SeverityConfig {
  label: string;
  bgColor: string;
  textColor: string;
  levelColor: string;
}

export const getSeverityConfig = (level: SeverityLevel): SeverityConfig => {
  const configs: Record<SeverityLevel, SeverityConfig> = {
    1: {
      label: '轻微',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      levelColor: 'bg-blue-500',
    },
    2: {
      label: '一般',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      levelColor: 'bg-green-500',
    },
    3: {
      label: '中等',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      levelColor: 'bg-yellow-500',
    },
    4: {
      label: '严重',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      levelColor: 'bg-orange-500',
    },
    5: {
      label: '特别重大',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      levelColor: 'bg-red-500',
    },
  };
  return configs[level];
};

interface TaskStatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

export const getTaskStatusConfig = (status: TaskStatus): TaskStatusConfig => {
  const configs: Record<TaskStatus, TaskStatusConfig> = {
    todo: {
      label: '待办',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    in_progress: {
      label: '进行中',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    review: {
      label: '审核中',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
    },
    completed: {
      label: '已完成',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    cancelled: {
      label: '已取消',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-500',
    },
  };
  return configs[status];
};

interface PriorityConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

export const getPriorityConfig = (priority: TaskPriority): PriorityConfig => {
  const configs: Record<TaskPriority, PriorityConfig> = {
    urgent: {
      label: '紧急',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: '🔥',
    },
    high: {
      label: '高',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      icon: '↑',
    },
    medium: {
      label: '中',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      icon: '→',
    },
    low: {
      label: '低',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: '↓',
    },
  };
  return configs[priority];
};

interface TaskTypeConfig {
  label: string;
  icon: string;
}

export const getTaskTypeConfig = (type: TaskType): TaskTypeConfig => {
  const configs: Record<TaskType, TaskTypeConfig> = {
    legal: {
      label: '法务',
      icon: '⚖️',
    },
    customer_service: {
      label: '客服',
      icon: '💬',
    },
    pr: {
      label: '公关',
      icon: '📢',
    },
    management: {
      label: '管理',
      icon: '📋',
    },
    other: {
      label: '其他',
      icon: '📌',
    },
  };
  return configs[type];
};

export const getPlatformLabel = (platform: PlatformType): string => {
  const labels: Record<PlatformType, string> = {
    weibo: '微博',
    wechat: '微信',
    douyin: '抖音',
    xiaohongshu: '小红书',
    zhihu: '知乎',
    baidu: '百度',
    media: '媒体报道',
    other: '其他平台',
  };
  return labels[platform];
};

interface DocTypeConfig {
  label: string;
  icon: string;
}

export const getDocTypeConfig = (type: DocumentType): DocTypeConfig => {
  const configs: Record<DocumentType, DocTypeConfig> = {
    statement: {
      label: '声明',
      icon: '📄',
    },
    media_reply: {
      label: '媒体回复',
      icon: '📰',
    },
    internal_report: {
      label: '内部报告',
      icon: '📊',
    },
    other: {
      label: '其他',
      icon: '📁',
    },
  };
  return configs[type];
};

interface ApprovalStatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

export const getApprovalStatusConfig = (status: ApprovalStatus): ApprovalStatusConfig => {
  const configs: Record<ApprovalStatus, ApprovalStatusConfig> = {
    draft: {
      label: '草稿',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    pending: {
      label: '待审批',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    approved: {
      label: '已通过',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    rejected: {
      label: '已驳回',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
  };
  return configs[status];
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: '管理员',
    pr: '公关',
    legal: '法务',
    cs: '客服',
    viewer: '查看者',
    management: '管理层',
  };
  return labels[role];
};

interface SentimentConfig {
  label: string;
  color: string;
}

export const getSentimentConfig = (type: SentimentType): SentimentConfig => {
  const configs: Record<SentimentType, SentimentConfig> = {
    negative: {
      label: '负面',
      color: 'text-red-500',
    },
    neutral: {
      label: '中性',
      color: 'text-gray-500',
    },
    positive: {
      label: '正面',
      color: 'text-green-500',
    },
  };
  return configs[type];
};
