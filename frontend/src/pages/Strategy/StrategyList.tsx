import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Play, Copy, Code2 } from 'lucide-react';
import apiClient from '../../api/client';
import type { Strategy } from '../../types';

export default function StrategyList() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await apiClient.get('/strategies');
      setStrategies(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个策略吗？')) return;
    
    try {
      await apiClient.delete(`/strategies/${id}`);
      setStrategies(strategies.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete strategy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gain';
      case 'archived': return 'bg-text-secondary';
      default: return 'bg-warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '运行中';
      case 'archived': return '已归档';
      default: return '草稿';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">策略管理</h1>
          <p className="text-text-secondary mt-1">创建和管理您的交易策略</p>
        </div>
        <button
          onClick={() => navigate('/strategies/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新建策略</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-32 mb-3"></div>
              <div className="skeleton h-4 w-full mb-2"></div>
              <div className="skeleton h-4 w-3/4 mb-4"></div>
              <div className="skeleton h-8 w-full"></div>
            </div>
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div className="card text-center py-16">
          <Code2 className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">暂无策略</h3>
          <p className="text-text-secondary mb-6">创建您的第一个量化交易策略</p>
          <button
            onClick={() => navigate('/strategies/new')}
            className="btn-primary"
          >
            创建策略
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="card hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {strategy.name}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {strategy.description || '暂无描述'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(strategy.status)}`}>
                  {getStatusText(strategy.status)}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-text-secondary mb-4">
                <span>Python</span>
                <span>•</span>
                <span>更新于 {new Date(strategy.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/strategies/${strategy.id}`)}
                  className="btn-primary flex-1 flex items-center justify-center space-x-1 py-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={() => navigate(`/backtest?strategy=${strategy.id}`)}
                  className="btn-secondary flex items-center justify-center px-3 py-2"
                  title="回测"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/strategies/new?clone=${strategy.id}`)}
                  className="btn-secondary flex items-center justify-center px-3 py-2"
                  title="克隆"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(strategy.id)}
                  className="btn-secondary flex items-center justify-center px-3 py-2 hover:text-loss"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">策略模板库</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: '双均线策略', desc: '短期均线上穿长期均线买入，下穿卖出' },
            { name: '突破策略', desc: '价格突破20日高点买入，跌破止损' },
            { name: 'RSI超卖策略', desc: 'RSI低于30买入，高于70卖出' },
          ].map((template, index) => (
            <div
              key={index}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => navigate('/strategies/new')}
            >
              <h4 className="font-medium text-text-primary mb-1">{template.name}</h4>
              <p className="text-sm text-text-secondary">{template.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
