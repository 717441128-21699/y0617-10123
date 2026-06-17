import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
  className?: string;
}

export default function RatingStars({
  value,
  onChange,
  readOnly = false,
  label,
  className,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const handleClick = (rating: number) => {
    if (readOnly) return;
    onChange?.(rating);
  };

  const getStarFill = (index: number) => {
    const displayValue = hoverValue > 0 ? hoverValue : value;
    if (index < displayValue) return '#F59E0B';
    return 'none';
  };

  const getStarStroke = (index: number) => {
    const displayValue = hoverValue > 0 ? hoverValue : value;
    if (index < displayValue) return '#F59E0B';
    return '#CBD5E1';
  };

  const ratingLabels = ['极差', '较差', '一般', '良好', '优秀'];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {label && (
        <span className="text-sm font-medium text-slate-600 min-w-[60px]">
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex items-center gap-1',
          !readOnly && 'cursor-pointer'
        )}
        onMouseLeave={() => setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            className={cn(
              'w-5 h-5 transition-all duration-150',
              !readOnly && 'hover:scale-110'
            )}
            style={{
              fill: getStarFill(index),
              stroke: getStarStroke(index),
              strokeWidth: 1.5,
            }}
            onMouseEnter={() => !readOnly && setHoverValue(index + 1)}
            onClick={() => handleClick(index + 1)}
          />
        ))}
      </div>
      {!readOnly && value > 0 && (
        <span className="text-xs text-slate-500 font-medium">
          {ratingLabels[value - 1]} ({value}.0)
        </span>
      )}
      {readOnly && value > 0 && (
        <span className="text-xs text-slate-500">
          {value}.0 / 5.0
        </span>
      )}
    </div>
  );
}
