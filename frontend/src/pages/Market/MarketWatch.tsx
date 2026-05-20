import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Star, Search, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import type { RealtimeQuote } from '../../types';

export default function MarketWatch() {
  const [quotes, setQuotes] = useState<RealtimeQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await apiClient.get('/market/realtime', {
        params: { codes: '000001.SZ,600519.SH,000858.SZ,601318.SH' }
      });
      setQuotes(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      setQuotes([
        { code: '000001', name: '平安银行', price: 12.85, change: 0.29, change_pct: 2.31, volume: 52364578, amount: 673456321, open: 12.56, high: 12.98, low: 12.45, close: 12.56, timestamp: new Date().toISOString() },
        { code: '600519', name: '贵州茅台', price: 1680.00, change: -20.40, change_pct: -1.20, volume: 2345678, amount: 3934567890, open: 1700.40, high: 1705.00, low: 1675.00, close: 1700.40, timestamp: new Date().toISOString() },
        { code: '000858', name: '五粮液', price: 145.60, change: 4.90, change_pct: 3.48, volume: 34567890, amount: 5034567890, open: 140.70, high: 146.20, low: 140.10, close: 140.70, timestamp: new Date().toISOString() },
        { code: '601318', name: '中国平安', price: 45.20, change: 0.80, change_pct: 1.80, volume: 45678901, amount: 2056789012, open: 44.40, high: 45.50, low: 44.20, close: 44.40, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.name.includes(searchTerm) || q.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">实时行情</h1>
          <p className="text-text-secondary mt-1">监控股票实时价格和走势</p>
        </div>
        <button onClick={fetchQuotes} className="btn-primary flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>刷新</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索股票代码或名称..."
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">股票代码</th>
                <th className="px-4 py-3 text-left">股票名称</th>
                <th className="px-4 py-3 text-right">最新价</th>
                <th className="px-4 py-3 text-right">涨跌幅</th>
                <th className="px-4 py-3 text-right">涨跌额</th>
                <th className="px-4 py-3 text-right">开盘价</th>
                <th className="px-4 py-3 text-right">最高价</th>
                <th className="px-4 py-3 text-right">最低价</th>
                <th className="px-4 py-3 text-right">成交量</th>
                <th className="px-4 py-3 text-right">成交额</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => (
                <tr key={quote.code} className="table-row">
                  <td className="px-4 py-3 text-text-primary mono-number">{quote.code}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">{quote.name}</td>
                  <td className="px-4 py-3 text-right text-text-primary mono-number">
                    ¥{quote.price.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right mono-number ${
                    quote.change_pct >= 0 ? 'gain-text' : 'loss-text'
                  }`}>
                    <div className="flex items-center justify-end space-x-1">
                      {quote.change_pct >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{quote.change_pct >= 0 ? '+' : ''}{quote.change_pct.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right mono-number ${
                    quote.change >= 0 ? 'gain-text' : 'loss-text'
                  }`}>
                    {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary mono-number">
                    ¥{quote.open.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary mono-number">
                    ¥{quote.high.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary mono-number">
                    ¥{quote.low.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary mono-number">
                    {(quote.volume / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary mono-number">
                    ¥{(quote.amount / 100000000).toFixed(2)}亿
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-2 hover:bg-white/10 rounded transition-colors">
                      <Star className="w-4 h-4 text-text-secondary hover:text-warning" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">市场快讯</h2>
        <div className="space-y-3">
          {[
            { time: '15:30', title: '沪指收涨0.85%，深成指涨1.20%', content: '今日A股三大指数集体收涨，沪指收报3285.67点' },
            { time: '14:45', title: '北向资金净流入超50亿元', content: '外资持续买入A股核心资产' },
            { time: '13:20', title: '茅台股价再创新高', content: '贵州茅台涨超2%，股价突破1700元' },
          ].map((news, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary mb-1">{news.title}</h3>
                  <p className="text-sm text-text-secondary">{news.content}</p>
                </div>
                <span className="text-xs text-text-secondary ml-4">{news.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
