import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarStatus = 'online' | 'offline';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const statusSizeClasses: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-success-500',
  offline: 'bg-slate-400',
};

export default function Avatar({
  src,
  name = '',
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const gradients = [
    'from-primary-400 to-primary-600',
    'from-success-400 to-success-600',
    'from-warning-400 to-warning-600',
    'from-info-400 to-info-600',
    'from-danger-400 to-danger-600',
  ];
  const gradientIndex = name
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      gradients.length
    : 0;

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'avatar'}
          className={cn(
            'rounded-full object-cover ring-2 ring-white',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-medium ring-2 ring-white',
            gradients[gradientIndex],
            sizeClasses[size]
          )}
        >
          {initials || '?'}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
