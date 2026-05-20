import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Save, Play, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

const defaultCode = `import pandas as pd
import numpy as np

def initialize(context):
    \"\"\"初始化策略参数\"\"\"
    context.stock = '000001.SZ'  # 平安银行
    context.ma_period = 20       # 均线周期
    context.target_ratio = 0.95  # 仓位目标

def handle_data(context, data):
    \"\"\"每日执行函数\"\"\"
    # 获取历史数据
    prices = data.history(context.stock, 'close', context.ma_period, '1d')
    
    # 计算均线
    ma = prices.mean()
    current_price = prices[-1]
    
    # 获取当前持仓
    position = context.portfolio.positions.get(context.stock, 0)
    
    # 交易逻辑
    if current_price > ma and position == 0:
        # 买入信号
        data.order_target_percent(context.stock, context.target_ratio)
    elif current_price < ma and position > 0:
        # 卖出信号
        data.order_target_percent(context.stock, 0)
`;

export default function StrategyEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState(defaultCode);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchStrategy();
    }
  }, [id]);

  const fetchStrategy = async () => {
    try {
      const response = await apiClient.get(`/strategies/${id}`);
      setName(response.data.name);
      setDescription(response.data.description || '');
      setCode(response.data.code);
    } catch (error) {
      console.error('Failed to fetch strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入策略名称');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        description,
        code,
        language: 'python',
      };

      if (isEditing) {
        await apiClient.put(`/strategies/${id}`, payload);
      } else {
        const response = await apiClient.post('/strategies', payload);
        navigate(`/strategies/${response.data.id}`);
        return;
      }

      alert('保存成功');
    } catch (error) {
      console.error('Failed to save strategy:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRunBacktest = () => {
    if (!isEditing) {
      alert('请先保存策略');
      return;
    }
    navigate(`/backtest?strategy=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/strategies')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditing ? '编辑策略' : '新建策略'}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunBacktest}
            className="btn-success flex items-center space-x-2"
            disabled={!isEditing}
          >
            <Play className="w-4 h-4" />
            <span>运行回测</span>
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              策略名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="输入策略名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              策略描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full h-20 resize-none"
              placeholder="描述策略的逻辑和特点"
            />
          </div>
        </div>

        <div className="flex-1 border border-white/10 rounded-lg overflow-hidden">
          <div className="bg-primary/50 px-4 py-2 border-b border-white/10">
            <span className="text-sm text-text-secondary">Python 代码编辑器</span>
          </div>
          <Editor
            height="calc(100% - 40px)"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
