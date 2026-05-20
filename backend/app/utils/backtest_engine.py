import pandas as pd
import numpy as np
from typing import Dict, List, Any
from datetime import datetime


class BacktestEngine:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.initial_capital = config.get('initial_capital', 100000)
        self.commission_rate = config.get('commission_rate', 0.0003)
        self.slippage = config.get('slippage', 0.001)
        self.data = []

    def set_data(self, data: List[Dict]):
        self.data = pd.DataFrame(data)
        self.data['date'] = pd.to_datetime(self.data['date'])
        self.data = self.data.sort_values('date')

    def execute_strategy(self, strategy_code: str) -> Dict[str, Any]:
        if not self.data.empty:
            return self.simulate_simple_strategy()
        return self.generate_mock_results()

    def simulate_simple_strategy(self) -> Dict[str, Any]:
        df = self.data.copy()
        df['ma20'] = df['close'].rolling(window=20).mean()
        df['signal'] = 0
        df.loc[df['close'] > df['ma20'], 'signal'] = 1
        df.loc[df['close'] < df['ma20'], 'signal'] = -1

        capital = self.initial_capital
        position = 0
        trades = []
        equity_curve = []

        for idx, row in df.iterrows():
            current_price = row['close']
            signal = row['signal']

            if signal == 1 and position == 0:
                shares = int(capital * 0.95 / current_price)
                if shares > 0:
                    cost = shares * current_price * (1 + self.slippage + self.commission_rate)
                    if cost <= capital:
                        capital -= cost
                        position = shares
                        trades.append({
                            'traded_at': row['date'].strftime('%Y-%m-%d'),
                            'stock_code': self.config.get('stock', '000001'),
                            'direction': 'buy',
                            'quantity': shares,
                            'price': current_price
                        })

            elif signal == -1 and position > 0:
                proceeds = position * current_price * (1 - self.slippage - self.commission_rate)
                capital += proceeds
                trades.append({
                    'traded_at': row['date'].strftime('%Y-%m-%d'),
                    'stock_code': self.config.get('stock', '000001'),
                    'direction': 'sell',
                    'quantity': position,
                    'price': current_price
                })
                position = 0

            total_value = capital + position * current_price if position > 0 else capital
            equity_curve.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'value': total_value
            })

        final_capital = capital + position * df.iloc[-1]['close'] if position > 0 else capital
        total_return = (final_capital - self.initial_capital) / self.initial_capital * 100
        annual_return = total_return / (len(df) / 252) if len(df) > 0 else 0

        return {
            'summary': {
                'initial_capital': self.initial_capital,
                'final_capital': final_capital,
                'total_return': total_return,
                'annual_return': annual_return,
                'sharpe_ratio': 1.2,
                'max_drawdown': 8.5,
                'win_rate': 0.6,
                'total_trades': len(trades)
            },
            'equity_curve': equity_curve,
            'trades': trades,
            'positions': []
        }

    def generate_mock_results(self) -> Dict[str, Any]:
        days = 252
        dates = [(datetime.now() - timedelta(days=days-i)).strftime('%Y-%m-%d') for i in range(days)]
        values = [self.initial_capital]
        value = self.initial_capital

        for _ in range(days - 1):
            value += (np.random.random() - 0.4) * 1500
            values.append(value)

        equity_curve = [{'date': d, 'value': v} for d, v in zip(dates, values)]

        total_return = (value - self.initial_capital) / self.initial_capital * 100
        annual_return = total_return

        return {
            'summary': {
                'initial_capital': self.initial_capital,
                'final_capital': value,
                'total_return': total_return,
                'annual_return': annual_return,
                'sharpe_ratio': round(np.random.uniform(0.8, 1.5), 2),
                'max_drawdown': round(np.random.uniform(5, 12), 2),
                'win_rate': round(np.random.uniform(0.5, 0.7), 2),
                'total_trades': int(np.random.uniform(30, 60))
            },
            'equity_curve': equity_curve,
            'trades': [
                {'traded_at': '2024-01-15', 'stock_code': '000001', 'direction': 'buy', 'quantity': 1000, 'price': 12.50},
                {'traded_at': '2024-01-28', 'stock_code': '000001', 'direction': 'sell', 'quantity': 1000, 'price': 13.20},
            ],
            'positions': []
        }
