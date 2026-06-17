import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from 'recharts';
import { formatDate } from '@/utils/date';
import { formatReach } from '@/utils/format';
import type { SentimentRecord } from '@/types';

interface SentimentTrendChartProps {
  records: SentimentRecord[];
  className?: string;
}

interface TrendDataPoint {
  date: string;
  recordedAt: string;
  mentionCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
  negativeRatio: number;
}

export default function SentimentTrendChart({ records, className }: SentimentTrendChartProps) {
  const chartData = useMemo<TrendDataPoint[]>(() => {
    return records
      .slice()
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((r) => ({
        date: formatDate(r.recordedAt),
        recordedAt: r.recordedAt,
        mentionCount: r.mentionCount,
        negativeCount: r.negativeCount,
        neutralCount: r.neutralCount,
        positiveCount: r.positiveCount,
        negativeRatio: r.mentionCount > 0 ? Math.round((r.negativeCount / r.mentionCount) * 100) : 0,
      }));
  }, [records]);

  const maxMention = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.mentionCount), 0);
    return max > 0 ? Math.ceil(max * 1.1) : 100;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as TrendDataPoint;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-xs space-y-2">
          <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1">
            {label}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">总提及量</span>
              <span className="font-medium text-blue-600">
                {formatReach(data.mentionCount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                负面
              </span>
              <span className="font-medium text-red-600">
                {formatReach(data.negativeCount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                中性
              </span>
              <span className="font-medium text-slate-600">
                {formatReach(data.neutralCount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                正面
              </span>
              <span className="font-medium text-green-600">
                {formatReach(data.positiveCount)}
              </span>
            </div>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">负面占比</span>
              <span className="font-medium text-red-600">{data.negativeRatio}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-slate-400 ${className}`}>
        <svg className="w-16 h-16 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p className="text-sm">暂无舆情数据</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '100%', minHeight: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="mentionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatReach(v)}
            domain={[0, maxMention]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#EF4444' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0' }} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconType="circle"
            iconSize={8}
            formatter={(value) => {
              const configs: Record<string, string> = {
                提及量: '总提及量',
                负面占比: '负面占比(%)',
              };
              return (
                <span className="text-xs text-slate-600">
                  {configs[value] || value}
                </span>
              );
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="mentionCount"
            name="提及量"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#mentionGradient)"
            activeDot={{ r: 5, fill: '#3B82F6' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="negativeRatio"
            name="负面占比"
            stroke="#EF4444"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#EF4444' }}
            activeDot={{ r: 6, fill: '#EF4444' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
