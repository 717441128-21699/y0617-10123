export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

export const formatReach = (num: number): string => {
  if (num < 10000) {
    return formatNumber(num);
  }
  if (num < 100000000) {
    const wan = num / 10000;
    return `${wan.toFixed(1).replace(/\.0$/, '')}万`;
  }
  const yi = num / 100000000;
  return `${yi.toFixed(1).replace(/\.0$/, '')}亿`;
};

export const truncateText = (text: string, maxLen: number): string => {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase();
};
