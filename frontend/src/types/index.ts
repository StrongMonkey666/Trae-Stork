export interface Strategy {
  id: number;
  name: string;
  description?: string;
  code: string;
  language: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyRequest {
  name: string;
  description?: string;
  code: string;
  language?: string;
}

export interface BacktestRecord {
  id: number;
  strategy_id: number;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital?: number;
  total_return?: number;
  annual_return?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  win_rate?: number;
  status: 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface CreateBacktestRequest {
  strategy_id: number;
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_rate?: number;
  slippage?: number;
}

export interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

export interface RealtimeQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  amount: number;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: string;
}

export interface Portfolio {
  id: number;
  name: string;
  total_capital: number;
  available_cash: number;
  market_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  created_at: string;
}

export interface Position {
  id: number;
  stock_code: string;
  stock_name: string;
  quantity: number;
  cost_price: number;
  current_price: number;
  market_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  opened_at: string;
}

export interface Trade {
  id: number;
  stock_code: string;
  stock_name: string;
  direction: 'buy' | 'sell';
  quantity: number;
  price: number;
  commission: number;
  traded_at: string;
}

export interface StockSearchResult {
  code: string;
  name: string;
  market: string;
  industry?: string;
}
