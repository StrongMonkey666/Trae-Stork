import akshare as ak
import pandas as pd
from typing import List, Optional
from datetime import datetime, timedelta


class AkShareHelper:
    @staticmethod
    def get_realtime_quotes(codes: List[str]) -> List[dict]:
        try:
            df = ak.stock_zh_a_spot_em()
            filtered = df[df['代码'].isin(codes)]

            results = []
            for _, row in filtered.iterrows():
                results.append({
                    'code': row['代码'],
                    'name': row['名称'],
                    'price': float(row['最新价']) if pd.notna(row['最新价']) else 0,
                    'change': float(row['涨跌额']) if pd.notna(row['涨跌额']) else 0,
                    'change_pct': float(row['涨跌幅']) if pd.notna(row['涨跌幅']) else 0,
                    'volume': float(row['成交量']) if pd.notna(row['成交量']) else 0,
                    'amount': float(row['成交额']) if pd.notna(row['成交额']) else 0,
                    'open': float(row['今开']) if pd.notna(row['今开']) else 0,
                    'high': float(row['最高']) if pd.notna(row['最高']) else 0,
                    'low': float(row['最低']) if pd.notna(row['最低']) else 0,
                    'close': float(row['昨收']) if pd.notna(row['昨收']) else 0,
                    'timestamp': datetime.now().isoformat()
                })

            return results
        except Exception as e:
            print(f"Error fetching realtime quotes: {e}")
            return []

    @staticmethod
    def get_kline_data(code: str, period: str = "daily", start_date: str = None, end_date: str = None) -> List[dict]:
        try:
            if start_date:
                start = start_date
            else:
                start = (datetime.now() - timedelta(days=365)).strftime('%Y%m%d')

            if end_date:
                end = end_date
            else:
                end = datetime.now().strftime('%Y%m%d')

            symbol = code.replace('.SH', '').replace('.SZ', '')

            if period == "daily":
                df = ak.stock_zh_a_hist(symbol=symbol, period="daily", start_date=start, end_date=end, adjust="qfq")
            else:
                df = ak.stock_zh_a_hist(symbol=symbol, period="daily", start_date=start, end_date=end, adjust="qfq")

            results = []
            for _, row in df.iterrows():
                results.append({
                    'date': row['日期'],
                    'open': float(row['开盘']),
                    'high': float(row['最高']),
                    'low': float(row['最低']),
                    'close': float(row['收盘']),
                    'volume': float(row['成交量']),
                    'amount': float(row['成交额']) if '成交额' in row else 0
                })

            return results
        except Exception as e:
            print(f"Error fetching kline data: {e}")
            return []

    @staticmethod
    def search_stocks(keyword: str) -> List[dict]:
        try:
            df = ak.stock_zh_a_spot_em()
            filtered = df[
                df['代码'].str.contains(keyword, na=False) |
                df['名称'].str.contains(keyword, na=False)
            ].head(20)

            results = []
            for _, row in filtered.iterrows():
                results.append({
                    'code': row['代码'],
                    'name': row['名称'],
                    'market': row.get('板块', '沪深A股'),
                    'industry': row.get('行业', '')
                })

            return results
        except Exception as e:
            print(f"Error searching stocks: {e}")
            return []

    @staticmethod
    def get_stock_name(code: str) -> str:
        try:
            symbol = code.replace('.SH', '').replace('.SZ', '')
            df = ak.stock_zh_a_spot_em()
            result = df[df['代码'] == symbol]

            if not result.empty:
                return result.iloc[0]['名称']
            return code
        except Exception as e:
            print(f"Error getting stock name: {e}")
            return code
