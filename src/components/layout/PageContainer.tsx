import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

interface PageContainerProps {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

const pathLabels: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/events': '事件管理',
  '/tasks': '任务中心',
  '/knowledge': '知识库',
};

export default function PageContainer({
  title,
  subtitle,
  children,
  actions,
}: PageContainerProps) {
  const location = useLocation();
  const currentPath = '/' + location.pathname.split('/')[1];
  const parentLabel = pathLabels[currentPath] || '首页';

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 space-y-5 overflow-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
            <Home className="w-3.5 h-3.5" />
            <span className="hover:text-primary-600 transition-colors cursor-pointer">
              首页
            </span>
            {parentLabel !== '首页' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-700">{parentLabel}</span>
              </>
            )}
          </nav>
          <h1 className="page-title">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
