import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import apiClient from '../../api/client';
import type { KLineData, StockSearchResult } from '../../types';

const defaultStock = '000001.SZ';

export default function TechnicalAnalysis() {
  const [stockCode, setStockCode] = useState(defaultStock);
  const [stockName, setStockName] = useState('平安银行');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState({
    MA: true,
    MACD: true,
    KDJ: false,
    RSI: false,
    BOLL: false,
  });

  useEffect(() => {
    fetchKlineData();
  }, [stockCode]);

  const fetchKlineData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await apiClient.get('/market/kline', {
        params: { code: stockCode, period: 'daily', start_date: startDate, end_date: endDate }
      });
      
      setKlineData(response.data.data || []);
      if (response.data.name) {
        setStockName(response.data.name);
      }
    } catch (error) {
      console.error('Failed to fetch kline data:', error);
      setKlineData(generateMockKlineData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockKlineData = (): KLineData[] => {
    const data: KLineData[] = [];
    let price = 12;
    
    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (99 - i));
      
      const change = (Math.random() - 0.5) * 0.5;
      const open = price;
      price = price + change;
      const close = price;
      const high = Math.max(open, close) + Math.random() * 0.3;
      const low = Math.min(open, close) - Math.random() * 0.3;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        amount: Math.floor(Math.random() * 100000000),
      });
    }
    
    return data;
  };

  const handleSearch = async (keyword: string) => {
    if (!keyword) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiClient.get('/market/search', {
        params: { keyword }
      });
      setSearchResults(response.data.items || []);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const selectStock = (code: string, name: string) => {
    setStockCode(code);
    setStockName(name);
    setShowSearch(false);
  };

  const getChartOption = () => {
    const dates = klineData.map(d => d.date);
    const closes = klineData.map(d => d.close);
    const highs = klineData.map(d => d.high);
    const lows = klineData.map(d => d.low);
    const opens = klineData.map(d => d.open);
    const volumes = klineData.map(d => d.volume);

    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const ma20 = calculateMA(closes, 20);

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#1B2838',
        borderColor: '#2C5282',
        textStyle: { color: '#E2E8F0' },
      },
      legend: {
        data: ['K线', 'MA5', 'MA10', 'MA20'],
        top: 10,
        textStyle: { color: '#A0AEC0' }
      },
      grid: [
        { left: '10%', right: '8%', top: '15%', height: '50%' },
        { left: '10%', right: '8%', top: '70%', height: '20%' }
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          gridIndex: 0,
          axisLine: { lineStyle: { color: '#2C5282' } },
          axisLabel: { color: '#A0AEC0' }
        },
        {
          type: 'category',
          data: dates,
          gridIndex: 1,
          axisLine: { lineStyle: { color: '#2C5282' } },
          axisLabel: { color: '#A0AEC0' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          scale: true,
          axisLine: { lineStyle: { color: '#2C5282' } },
          axisLabel: { color: '#A0AEC0', formatter: (v: number) => `¥${v}` },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
        },
        {
          type: 'value',
          gridIndex: 1,
          scale: true,
          axisLine: { lineStyle: { color: '#2C5282' } },
          axisLabel: { color: '#A0AEC0', formatter: (v: number) => `${(v/10000000).toFixed(1)}M` },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: klineData.map(d => [d.open, d.close, d.low, d.high]),
          itemStyle: {
            color: '#48BB78',
            color0: '#F56565',
            borderColor: '#48BB78',
            borderColor0: '#F56565'
          },
          xAxisIndex: 0,
          yAxisIndex: 0
        },
        ...(indicators.MA ? [
          { name: 'MA5', type: 'line', data: ma5, smooth: true, lineStyle: { color: '#ECC94B', width: 1 }, xAxisIndex: 0, yAxisIndex: 0 },
          { name: 'MA10', type: 'line', data: ma10, smooth: true, lineStyle: { color: '#4299E1', width: 1 }, xAxisIndex: 0, yAxisIndex: 0 },
          { name: 'MA20', type: 'line', data: ma20, smooth: true, lineStyle: { color: '#9F7AEA', width: 1 }, xAxisIndex: 0, yAxisIndex: 0 }
        ] : []),
        {
          name: '成交量',
          type: 'bar',
          data: volumes.map((v, i) => ({
            value: v,
            itemStyle: {
              color: closes[i] >= opens[i] ? 'rgba(72,187,120,0.5)' : 'rgba(245,101,101,0.5)'
            }
          })),
          xAxisIndex: 1,
          yAxisIndex: 1
        }
      ]
    };

    return option;
  };

  const calculateMA = (data: number[], period: number): (number | null)[] => {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      return Number((sum / period).toFixed(2));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">技术分析</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              value={stockCode}
              onChange={(e) => {
                setStockCode(e.target.value);
                handleSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="input-field w-48"
              placeholder="股票代码"
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-card border border-white/10 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.code}
                    onClick={() => selectStock(result.code, result.name)}
                    className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                  >
                    <div className="text-sm text-text-primary">{result.name}</div>
                    <div className="text-xs text-text-secondary">{result.code}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={fetchKlineData} className="btn-primary">
            查询
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{stockName}</h2>
            <p className="text-text-secondary">{stockCode}</p>
          </div>
          {klineData.length > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-text-primary mono-number">
                ¥{klineData[klineData.length - 1].close.toFixed(2)}
              </p>
              <div className={`flex items-center justify-end space-x-1 ${
                klineData[klineData.length - 1].close >= klineData[klineData.length - 1].open 
                  ? 'gain-text' : 'loss-text'
              }`}>
                {klineData[klineData.length - 1].close >= klineData[klineData.length - 1].open ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="mono-number">
                  {((klineData[klineData.length - 1].close - klineData[klineData.length - 1].open) / klineData[klineData.length - 1].open * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(indicators).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setIndicators({ ...indicators, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-secondary text-primary focus:ring-primary"
              />
              <span className="text-sm text-text-secondary">{key}</span>
            </label>
          ))}
        </div>

        <ReactECharts
          option={getChartOption()}
          style={{ height: '600px' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
}
