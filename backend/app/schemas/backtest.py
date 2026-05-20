from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class BacktestCreate(BaseModel):
    strategy_id: int
    start_date: date
    end_date: date
    initial_capital: float
    commission_rate: float = 0.0003
    slippage: float = 0.001


class BacktestResponse(BaseModel):
    id: int
    strategy_id: int
    start_date: date
    end_date: date
    initial_capital: float
    final_capital: Optional[float] = None
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    win_rate: Optional[float] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BacktestResultResponse(BaseModel):
    summary: dict
    equity_curve: List[dict]
    trades: List[dict]
    positions: List[dict]
