const pad = (num: number): string => num.toString().padStart(2, '0');

export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

export const formatRelative = (iso: string): string => {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = now - target;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  if (diffMonth < 12) return `${diffMonth}个月前`;
  return `${diffYear}年前`;
};

export const isOverdue = (deadline: string): boolean => {
  return new Date(deadline).getTime() < Date.now();
};

export const daysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(formatDate(date1));
  const d2 = new Date(formatDate(date2));
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};
