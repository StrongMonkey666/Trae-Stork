import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Briefcase, DollarSign, BarChart3 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import apiClient from '../../api/client';

interface Portfolio {
  id: number;
  name: string;
  total_capital: number;
  available_cash: number;
  market_value: number;
  profit_loss: number;
  profit_loss_pct: number;
}

interface Position {
  id: number;
  stock_code: string;
  stock_name: string;
  quantity: number;
  cost_price: number;
  current_price: number;
  profit_loss: number;
  profit_loss_pct: number;
}

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [equityCurveOption, setEquityCurveOption] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const portfolioRes = await apiClient.get('/portfolio');
      if (portfolioRes.data.length > 0) {
        setPortfolio(portfolioRes.data[0]);
        
        const positionsRes = await apiClient.get(`/portfolio/${portfolioRes.data[0].id}/positions`);
        setPositions(positionsRes.data.slice(0, 5));
      }

      const mockEquityData = generateMockEquityCurve();
      setEquityCurveOption(mockEquityData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setPortfolio({
        id: 1,
        name: '默认组合',
        total_capital: 100000,
        available_cash: 60000,
        market_value: 40000,
        profit_loss: 3500,
        profit_loss_pct: 3.5,
      });
      setPositions([]);
      setEquityCurveOption(generateMockEquityCurve());
    } finally {
      setLoading(false);
    }
  };

  const generateMockEquityCurve = () => {
    const dates = [];
    const values = [];
    let value = 100000;

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
      
      value += (Math.random() - 0.4) * 2000;
      values.push(Math.round(value * 100) / 100);
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: '#1B2838',
        borderColor: '#2C5282',
        textStyle: {
          color: '#E2E8F0'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#2C5282'
          }
        },
        axisLabel: {
          color: '#A0AEC0'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#2C5282'
          }
        },
        axisLabel: {
          color: '#A0AEC0',
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,0.1)'
          }
        }
      },
      series: [
        {
          name: '总资产',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: values,
          lineStyle: {
            color: '#48BB78',
            width: 2
          },
          itemStyle: {
            color: '#48BB78'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(72, 187, 120, 0.3)' },
                { offset: 1, color: 'rgba(72, 187, 120, 0.05)' }
              ]
            }
          }
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">仪表盘</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm">总资产</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-text-primary mono-number">
              ¥{portfolio?.total_capital.toLocaleString() || '100,000'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm">今日收益</span>
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
              ¥{portfolio?.profit_loss.toLocaleString() || '3,500'}
            </p>
            <p className={`text-sm mono-number ${
              portfolio && portfolio.profit_loss_pct >= 0 ? 'gain-text' : 'loss-text'
            }`}>
              {portfolio && portfolio.profit_loss_pct >= 0 ? '+' : ''}
              {portfolio?.profit_loss_pct.toFixed(2) || '3.50'}%
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm">持仓市值</span>
              <Briefcase className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-text-primary mono-number">
              ¥{portfolio?.market_value.toLocaleString() || '40,000'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm">可用资金</span>
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-text-primary mono-number">
              ¥{portfolio?.available_cash.toLocaleString() || '60,000'}
            </p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">收益曲线</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-primary text-white rounded">近7日</button>
              <button className="px-3 py-1 text-sm text-text-secondary hover:bg-white/5 rounded">近30日</button>
              <button className="px-3 py-1 text-sm text-text-secondary hover:bg-white/5 rounded">全部</button>
            </div>
          </div>
          <ReactECharts
            option={equityCurveOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">持仓概览</h2>
              <a href="/portfolio" className="text-primary text-sm hover:text-primary-light">
                查看全部 →
              </a>
            </div>
            
            {positions.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无持仓</p>
                <p className="text-sm mt-1">开始您的第一笔交易吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{position.stock_name}</p>
                      <p className="text-sm text-text-secondary">{position.stock_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary mono-number">
                        {position.quantity}股
                      </p>
                      <p className={`text-sm mono-number ${
                        position.profit_loss >= 0 ? 'gain-text' : 'loss-text'
                      }`}>
                        {position.profit_loss >= 0 ? '+' : ''}
                        ¥{position.profit_loss.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">市场动态</h2>
              <a href="/market" className="text-primary text-sm hover:text-primary-light">
                查看全部 →
              </a>
            </div>
            
            <div className="space-y-3">
              {[
                { code: '000001', name: '平安银行', price: 12.85, change: 2.3 },
                { code: '600519', name: '贵州茅台', price: 1680.00, change: -1.2 },
                { code: '000858', name: '五粮液', price: 145.60, change: 3.5 },
                { code: '601318', name: '中国平安', price: 45.20, change: 1.8 },
              ].map((stock) => (
                <div
                  key={stock.code}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{stock.name}</p>
                    <p className="text-sm text-text-secondary">{stock.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-text-primary mono-number">
                      ¥{stock.price.toLocaleString()}
                    </p>
                    <p className={`text-sm mono-number ${
                      stock.change >= 0 ? 'gain-text' : 'loss-text'
                    }`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
