import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  BarChart3,
  TrendingUp,
  LineChart,
  Briefcase,
  Settings,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/strategies', label: '策略管理', icon: Code2 },
  { path: '/backtest', label: '回测分析', icon: BarChart3 },
  { path: '/market', label: '实时行情', icon: TrendingUp },
  { path: '/technical', label: '技术分析', icon: LineChart },
  { path: '/portfolio', label: '组合管理', icon: Briefcase },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-60 bg-card border-r border-white/10 flex flex-col">
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-text-secondary hover:bg-white/5 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">设置</span>
        </button>
      </div>
    </aside>
  );
}
