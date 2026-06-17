import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

const pathTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/events': '事件管理',
  '/tasks': '任务中心',
  '/knowledge': '知识库',
};

export default function Topbar() {
  const location = useLocation();
  const { tasks } = useTaskStore();
  const { currentUser } = useUserStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pendingCount = tasks.filter(
    (t) => t.status === 'todo' || t.status === 'in_progress'
  ).length;

  const currentPath = '/' + location.pathname.split('/')[1];
  const pageTitle = pathTitles[currentPath] || '首页';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">首页</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent transition-all"
          />
        </div>

        <button className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
          <Bell className="w-4.5 h-4.5" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white" />
          )}
        </button>

        <button className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
          <MessageSquare className="w-4.5 h-4.5" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 pr-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-card-hover border border-slate-100 py-1.5 animate-slide-up z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-slate-500">{currentUser?.email}</p>
              </div>
              <button className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                个人设置
              </button>
              <button className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
