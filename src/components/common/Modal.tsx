import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: ModalMaxWidth;
  onClose: () => void;
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
}

const maxWidthClasses: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw]',
};

export default function Modal({
  open,
  title,
  children,
  footer,
  maxWidth = 'md',
  onClose,
  closeOnOverlay = true,
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in',
          closeOnOverlay && 'cursor-pointer'
        )}
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-card-hover border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up',
          maxWidthClasses[maxWidth]
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
            {title && (
              <h3 className="text-lg font-serif font-semibold text-slate-800">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors -mr-1"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1 scroll-thin">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
