import { Bell, Search, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-text-primary">
          私人交易策略平台
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索股票..."
            className="input-field w-64 pl-10 pr-4 py-2 text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        </div>

        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-loss rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">
              {user?.nickname || user?.email || '用户'}
            </p>
            <p className="text-xs text-text-secondary">
              {user?.email}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-text-secondary" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
