import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { formatReach } from '@/utils/format';
import { getPlatformLabel } from '@/utils/status';
import type { SentimentRecord, PlatformType } from '@/types';

interface PlatformBarChartProps {
  records: SentimentRecord[];
  className?: string;
}

interface PlatformData {
  platform: PlatformType;
  label: string;
  count: number;
  negative: number;
  neutral: number;
  positive: number;
}

const PLATFORM_GRADIENT = {
  weibo: { from: '#EF4444', to: '#F97316' },
  wechat: { from: '#22C55E', to: '#16A34A' },
  douyin: { from: '#000000', to: '#6366F1' },
  xiaohongshu: { from: '#F43F5E', to: '#FB7185' },
  zhihu: { from: '#3B82F6', to: '#0EA5E9' },
  baidu: { from: '#2563EB', to: '#38BDF8' },
  media: { from: '#8B5CF6', to: '#A78BFA' },
  other: { from: '#94A3B8', to: '#CBD5E1' },
};

export default function PlatformBarChart({ records, className }: PlatformBarChartProps) {
  const chartData = useMemo<PlatformData[]>(() => {
    const platformMap = new Map<PlatformType, PlatformData>();

    records.forEach((record) => {
      const totalNegative = record.negativeCount;
      const totalNeutral = record.neutralCount;
      const totalPositive = record.positiveCount;
      const totalMention = record.mentionCount;

      record.platformBreakdown.forEach((pb) => {
        const platformRatio = totalMention > 0 ? pb.count / totalMention : 0;
        const existing = platformMap.get(pb.platform) || {
          platform: pb.platform,
          label: getPlatformLabel(pb.platform),
          count: 0,
          negative: 0,
          neutral: 0,
          positive: 0,
        };

        platformMap.set(pb.platform, {
          ...existing,
          count: existing.count + pb.count,
          negative: existing.negative + Math.round(totalNegative * platformRatio),
          neutral: existing.neutral + Math.round(totalNeutral * platformRatio),
          positive: existing.positive + Math.round(totalPositive * platformRatio),
        });
      });
    });

    return Array.from(platformMap.values()).sort((a, b) => b.count - a.count);
  }, [records]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as PlatformData;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-xs space-y-2">
          <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1">
            {data.label}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">总提及</span>
              <span className="font-medium text-slate-800">{formatReach(data.count)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                负面
              </span>
              <span className="font-medium text-red-600">{formatReach(data.negative)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                中性
              </span>
              <span className="font-medium text-slate-600">{formatReach(data.neutral)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                正面
              </span>
              <span className="font-medium text-green-600">{formatReach(data.positive)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-slate-400 ${className}`}>
        <svg className="w-16 h-16 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">暂无平台数据</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '100%', minHeight: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 50, left: 20, bottom: 10 }}
          barCategoryGap="25%"
        >
          <defs>
            {Object.entries(PLATFORM_GRADIENT).map(([key, colors]) => (
              <linearGradient
                key={key}
                id={`gradient-${key}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            tickFormatter={(v) => formatReach(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            <LabelList
              dataKey="count"
              position="right"
              formatter={(v: number) => formatReach(v)}
              style={{ fontSize: 11, fill: '#64748B' }}
            />
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${entry.platform})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
