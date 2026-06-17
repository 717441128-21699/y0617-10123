import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts';
import { formatReach } from '@/utils/format';

interface SentimentPieChartProps {
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
  className?: string;
}

const COLORS = {
  negative: '#EF4444',
  neutral: '#94A3B8',
  positive: '#22C55E',
};

const LABELS = {
  negative: '负面',
  neutral: '中性',
  positive: '正面',
};

export default function SentimentPieChart({
  negativeCount,
  neutralCount,
  positiveCount,
  className,
}: SentimentPieChartProps) {
  const total = negativeCount + neutralCount + positiveCount;

  const data = [
    { name: 'negative', value: negativeCount, label: LABELS.negative, color: COLORS.negative },
    { name: 'neutral', value: neutralCount, label: LABELS.neutral, color: COLORS.neutral },
    { name: 'positive', value: positiveCount, label: LABELS.positive, color: COLORS.positive },
  ].filter((d) => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const ratio = total > 0 ? Math.round((item.value / total) * 100) : 0;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.payload.color }}
            />
            <span className="font-medium text-slate-700">{item.payload.label}</span>
          </div>
          <p className="text-slate-600">
            数量：<span className="font-medium text-slate-800">{formatReach(item.value)}</span>
          </p>
          <p className="text-slate-600">
            占比：<span className="font-medium text-slate-800">{ratio}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-slate-400 ${className}`}>
        <svg className="w-16 h-16 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-sm">暂无情感数据</p>
      </div>
    );
  }

  const renderLegend = () => {
    return (
      <div className="flex items-center justify-center gap-6 mt-2">
        {data.map((entry) => {
          const ratio = Math.round((entry.value / total) * 100);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="text-xs">
                <span className="text-slate-600">{entry.label}</span>
                <span className="text-slate-400 mx-1">·</span>
                <span className="font-medium text-slate-700">{ratio}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={className} style={{ height: '100%', minHeight: 280 }}>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={renderLegend}
            wrapperStyle={{ paddingBottom: 0 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-[100px] relative z-10 pointer-events-none">
        <p className="text-xs text-slate-400 mb-1">总提及量</p>
        <p className="text-2xl font-bold text-slate-800">{formatReach(total)}</p>
      </div>
    </div>
  );
}
