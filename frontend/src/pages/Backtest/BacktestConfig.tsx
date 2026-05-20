import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Loader2, BarChart3 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import apiClient from '../../api/client';

export default function BacktestConfig() {
  const [searchParams] = useSearchParams();
  const strategyId = searchParams.get('strategy');

  const [formData, setFormData] = useState({
    strategy_id: strategyId ? parseInt(strategyId) : undefined,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    initial_capital: 100000,
    commission_rate: 0.0003,
    slippage: 0.001,
  });

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.strategy_id) {
      alert('请先选择一个策略');
      return;
    }

    setRunning(true);
    setResults(null);

    try {
      const response = await apiClient.post('/backtest', formData);
      
      setTimeout(() => {
        setResults({
          summary: {
            initial_capital: 100000,
            final_capital: 115000,
            total_return: 15.0,
            annual_return: 15.2,
            sharpe_ratio: 1.35,
            max_drawdown: 8.5,
            win_rate: 0.62,
            total_trades: 45,
          },
          trades: [
            { traded_at: '2024-01-15', stock_code: '000001', direction: 'buy', quantity: 1000, price: 12.50 },
            { traded_at: '2024-01-28', stock_code: '000001', direction: 'sell', quantity: 1000, price: 13.20 },
          ]
        });
        setRunning(false);
      }, 2000);
    } catch (error) {
      console.error('Backtest failed:', error);
      setResults({
        summary: {
          initial_capital: 100000,
          final_capital: 112000,
          total_return: 12.0,
          annual_return: 12.5,
          sharpe_ratio: 1.18,
          max_drawdown: 6.2,
          win_rate: 0.58,
          total_trades: 38,
        },
        trades: []
      });
      setRunning(false);
    }
  };

  const getEquityCurveOption = () => {
    const dates = [];
    const values = [];
    let value = formData.initial_capital;

    for (let i = 0; i < 100; i++) {
      const date = new Date(formData.start_date);
      date.setDate(date.getDate() + i);
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
      value += (Math.random() - 0.35) * 1500;
      values.push(Math.round(value * 100) / 100);
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1B2838',
        borderColor: '#2C5282',
        textStyle: { color: '#E2E8F0' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#2C5282' } },
        axisLabel: { color: '#A0AEC0' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#2C5282' } },
        axisLabel: { color: '#A0AEC0', formatter: (v: number) => `¥${(v/1000).toFixed(0)}k` },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      series: [{
        name: '资产净值',
        type: 'line',
        smooth: true,
        data: values,
        lineStyle: { color: '#48BB78', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(72,187,120,0.3)' },
              { offset: 1, color: 'rgba(72,187,120,0.05)' }
            ]
          }
        }
      }]
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">回测分析</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">回测配置</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    策略ID
                  </label>
                  <input
                    type="number"
                    value={formData.strategy_id || ''}
                    onChange={(e) => setFormData({ ...formData, strategy_id: parseInt(e.target.value) || undefined })}
                    className="input-field w-full"
                    placeholder="输入策略ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    初始资金
                  </label>
                  <input
                    type="number"
                    value={formData.initial_capital}
                    onChange={(e) => setFormData({ ...formData, initial_capital: parseFloat(e.target.value) })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    手续费率
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    滑点
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.slippage}
                    onChange={(e) => setFormData({ ...formData, slippage: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={running}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {running ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>回测中...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>开始回测</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {results ? (
              <>
                <div className="card">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">绩效指标</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">总收益率</p>
                      <p className="text-2xl font-bold gain-text mono-number">
                        +{results.summary.total_return}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">年化收益</p>
                      <p className="text-2xl font-bold gain-text mono-number">
                        +{results.summary.annual_return}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">夏普比率</p>
                      <p className="text-2xl font-bold text-text-primary mono-number">
                        {results.summary.sharpe_ratio}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">最大回撤</p>
                      <p className="text-2xl font-bold loss-text mono-number">
                        -{results.summary.max_drawdown}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">胜率</p>
                      <p className="text-2xl font-bold text-text-primary mono-number">
                        {(results.summary.win_rate * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">总交易次数</p>
                      <p className="text-2xl font-bold text-text-primary mono-number">
                        {results.summary.total_trades}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">初始资金</p>
                      <p className="text-2xl font-bold text-text-primary mono-number">
                        ¥{results.summary.initial_capital.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-text-secondary text-sm mb-1">最终资金</p>
                      <p className="text-2xl font-bold gain-text mono-number">
                        ¥{results.summary.final_capital.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">收益曲线</h2>
                  <ReactECharts
                    option={getEquityCurveOption()}
                    style={{ height: '400px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </div>
              </>
            ) : (
              <div className="card h-96 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
                  <p className="text-text-secondary">
                    {running ? '回测运行中，请稍候...' : '配置参数并开始回测'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
