import { useState } from 'react';
import { User, Mail, Lock, Bell, Key } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: '个人信息', icon: User },
    { id: 'security', label: '账户安全', icon: Lock },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'api', label: 'API密钥', icon: Key },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">用户中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex flex-col space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-6">个人信息</h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {user?.nickname?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">
                      {user?.nickname || '用户'}
                    </h3>
                    <p className="text-text-secondary">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.nickname || ''}
                      className="input-field w-full"
                      placeholder="输入昵称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={user?.email}
                      className="input-field w-full"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-primary">保存修改</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-6">账户安全</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary mb-1">修改密码</h3>
                      <p className="text-sm text-text-secondary">定期更换密码可以提高账户安全性</p>
                    </div>
                    <button className="btn-secondary">修改</button>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary mb-1">邮箱绑定</h3>
                      <p className="text-sm text-text-secondary">
                        {user?.email ? `已绑定: ${user.email}` : '未绑定邮箱'}
                      </p>
                    </div>
                    <button className="btn-secondary">绑定</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-6">通知设置</h2>
              
              <div className="space-y-4">
                {[
                  { label: '邮件通知', desc: '接收策略执行和回测结果的邮件通知', enabled: true },
                  { label: '策略提醒', desc: '策略信号触发时发送通知', enabled: false },
                  { label: '市场快讯', desc: '接收市场动态和重大新闻', enabled: true },
                  { label: '风险告警', desc: '持仓亏损达到阈值时发送告警', enabled: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary mb-1">{item.label}</h3>
                      <p className="text-sm text-text-secondary">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-6">API密钥管理</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-text-primary mb-1">API密钥</h3>
                      <p className="text-sm text-text-secondary">
                        使用API密钥可以安全地访问您的账户数据
                      </p>
                    </div>
                    <button className="btn-primary">生成密钥</button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded border border-white/10">
                      <p className="text-xs text-text-secondary mb-1">密钥名称</p>
                      <p className="text-sm text-text-primary mono-number">sk_live_xxxxxxxxxxxx</p>
                    </div>
                    <div className="p-3 bg-background rounded border border-white/10">
                      <p className="text-xs text-text-secondary mb-1">创建时间</p>
                      <p className="text-sm text-text-primary">2024-01-15 10:30:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
