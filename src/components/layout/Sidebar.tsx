import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  AlertTriangle,
  ListTodo,
  BookOpen,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/events', label: '事件管理', icon: AlertTriangle },
  { path: '/tasks', label: '任务中心', icon: ListTodo },
  { path: '/knowledge', label: '知识库', icon: BookOpen },
];

const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  pr: '公关专员',
  legal: '法务专员',
  cs: '客服主管',
  viewer: '观察员',
  management: '管理层',
};

export default function Sidebar() {
  const { currentUser } = useUserStore();

  return (
    <aside className="w-60 h-screen bg-white border-r border-slate-100 shadow-nav flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <span className="text-base font-serif font-semibold text-slate-800">
          危机管理平台
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'nav-item-active')
            }
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {currentUser?.name || '未登录'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {currentUser ? roleLabels[currentUser.role] || currentUser.role : ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
