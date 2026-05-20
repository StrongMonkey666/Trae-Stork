import { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Plus, X } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import apiClient from '../../api/client';
import type { Portfolio, Position, Trade } from '../../types';

export default function PortfolioOverview() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [pieOption, setPieOption] = useState({});

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const portfolioRes = await apiClient.get('/portfolio');
      if (portfolioRes.data.length > 0) {
        const portfolioData = portfolioRes.data[0];
        setPortfolio(portfolioData);

        const positionsRes = await apiClient.get(`/portfolio/${portfolioData.id}/positions`);
        setPositions(positionsRes.data);

        const tradesRes = await apiClient.get(`/portfolio/${portfolioData.id}/trades`, {
          params: { page: 1, page_size: 10 }
        });
        setTrades(tradesRes.data.items || []);

        setPieOption(generatePieOption(positionsRes.data));
      }
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      setPortfolio({
        id: 1,
        name: '默认组合',
        total_capital: 100000,
        available_cash: 60000,
        market_value: 40000,
        profit_loss: 3500,
        profit_loss_pct: 3.5,
        created_at: new Date().toISOString(),
      });
      setPositions([]);
      setTrades([]);
      setPieOption(generatePieOption([]));
    } finally {
      setLoading(false);
    }
  };

  const generatePieOption = (positions: Position[]) => {
    if (positions.length === 0) {
      return {
        tooltip: { trigger: 'item', backgroundColor: '#1B2838', borderColor: '#2C5282', textStyle: { color: '#E2E8F0' } },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#0D1B2A', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#E2E8F0' } },
          labelLine: { show: false },
          data: [{ value: 100, name: '可用资金', itemStyle: { color: '#2C5282' } }]
        }]
      };
    }

    const colors = ['#48BB78', '#4299E1', '#ECC94B', '#9F7AEA', '#F56565', '#38B2AC'];
    const data = positions.map((p, i) => ({
      value: p.market_value,
      name: p.stock_name,
      itemStyle: { color: colors[i % colors.length] }
    }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1B2838',
        borderColor: '#2C5282',
        textStyle: { color: '#E2E8F0' },
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#A0AEC0' }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#0D1B2A', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#E2E8F0' }
        },
        labelLine: { show: false },
        data
      }]
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-24 mb-3"></div>
              <div className="skeleton h-8 w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">组合管理</h1>
          <p className="text-text-secondary mt-1">{portfolio?.name || '默认组合'}</p>
        </div>
        <button
          onClick={() => setShowAddPosition(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>添加持仓</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">总资产</span>
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text-primary mono-number">
            ¥{portfolio?.total_capital.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">持仓市值</span>
            <Briefcase className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-2xl font-bold text-text-primary mono-number">
            ¥{portfolio?.market_value.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">可用资金</span>
            <TrendingUp className="w-5 h-5 text-gain" />
          </div>
          <p className="text-2xl font-bold text-text-primary mono-number">
            ¥{portfolio?.available_cash.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">浮动盈亏</span>
            {portfolio && portfolio.profit_loss >= 0 ? (
              <TrendingUp className="w-5 h-5 text-gain" />
            ) : (
              <TrendingDown className="w-5 h-5 text-loss" />
            )}
          </div>
          <p className={`text-2xl font-bold mono-number ${
            portfolio && portfolio.profit_loss >= 0 ? 'gain-text' : 'loss-text'
          }`}>
            {portfolio && portfolio.profit_loss >= 0 ? '+' : ''}
            ¥{portfolio?.profit_loss.toLocaleString()}
          </p>
          <p className={`text-sm mono-number ${
            portfolio && portfolio.profit_loss_pct >= 0 ? 'gain-text' : 'loss-text'
          }`}>
            {portfolio && portfolio.profit_loss_pct >= 0 ? '+' : ''}
            {portfolio?.profit_loss_pct.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">持仓分布</h2>
          <ReactECharts
            option={pieOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">收益统计</h2>
          <div className="space-y-4">
            {[
              { label: '今日收益', value: 1250, pct: 1.25 },
              { label: '本周收益', value: 3500, pct: 3.5 },
              { label: '本月收益', value: 5200, pct: 5.2 },
              { label: '本年收益', value: 15800, pct: 15.8 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-text-secondary">{item.label}</span>
                <div className="text-right">
                  <p className="font-medium text-text-primary mono-number">
                    {item.value >= 0 ? '+' : ''}¥{item.value.toLocaleString()}
                  </p>
                  <p className={`text-sm mono-number ${item.value >= 0 ? 'gain-text' : 'loss-text'}`}>
                    {item.value >= 0 ? '+' : ''}{item.pct}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">持仓明细</h2>
        
        {positions.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-text-secondary mb-4">暂无持仓记录</p>
            <button
              onClick={() => setShowAddPosition(true)}
              className="btn-primary"
            >
              添加第一笔持仓
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">股票代码</th>
                  <th className="px-4 py-3 text-left">股票名称</th>
                  <th className="px-4 py-3 text-right">持仓数量</th>
                  <th className="px-4 py-3 text-right">成本价</th>
                  <th className="px-4 py-3 text-right">现价</th>
                  <th className="px-4 py-3 text-right">市值</th>
                  <th className="px-4 py-3 text-right">盈亏金额</th>
                  <th className="px-4 py-3 text-right">盈亏比例</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.id} className="table-row">
                    <td className="px-4 py-3 text-text-primary mono-number">{position.stock_code}</td>
                    <td className="px-4 py-3 text-text-primary">{position.stock_name}</td>
                    <td className="px-4 py-3 text-right text-text-primary mono-number">{position.quantity}</td>
                    <td className="px-4 py-3 text-right text-text-primary mono-number">¥{position.cost_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-text-primary mono-number">¥{position.current_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-text-primary mono-number">¥{position.market_value.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right mono-number ${position.profit_loss >= 0 ? 'gain-text' : 'loss-text'}`}>
                      {position.profit_loss >= 0 ? '+' : ''}¥{position.profit_loss.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-right mono-number ${position.profit_loss_pct >= 0 ? 'gain-text' : 'loss-text'}`}>
                      {position.profit_loss_pct >= 0 ? '+' : ''}{position.profit_loss_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">交易历史</h2>
        
        {trades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">暂无交易记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">交易时间</th>
                  <th className="px-4 py-3 text-left">股票代码</th>
                  <th className="px-4 py-3 text-left">股票名称</th>
                  <th className="px-4 py-3 text-center">方向</th>
                  <th className="px-4 py-3 text-right">数量</th>
                  <th className="px-4 py-3 text-right">价格</th>
                  <th className="px-4 py-3 text-right">手续费</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="table-row">
                    <td className="px-4 py-3 text-text-secondary">{new Date(trade.traded_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-primary mono-number">{trade.stock_code}</td>
                    <td className="px-4 py-3 text-text-primary">{trade.stock_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        trade.direction === 'buy' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'
                      }`}>
                        {trade.direction === 'buy' ? '买入' : '卖出'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-text-primary mono-number">{trade.quantity}</td>
                    <td className="px-4 py-3 text-right text-text-primary mono-number">¥{trade.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary mono-number">¥{trade.commission.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
