from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PositionBase(BaseModel):
    stock_code: str
    stock_name: Optional[str] = None
    quantity: int
    cost_price: float


class PositionCreate(PositionBase):
    pass


class PositionResponse(PositionBase):
    id: int
    portfolio_id: int
    current_price: Optional[float] = None
    market_value: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_pct: Optional[float] = None
    opened_at: datetime

    class Config:
        from_attributes = True


class TradeCreate(BaseModel):
    stock_code: str
    stock_name: Optional[str] = None
    direction: str
    quantity: int
    price: float
    commission: float = 0


class TradeResponse(TradeCreate):
    id: int
    portfolio_id: int
    position_id: Optional[int] = None
    traded_at: datetime

    class Config:
        from_attributes = True


class PortfolioBase(BaseModel):
    name: str
    total_capital: float


class PortfolioCreate(PortfolioBase):
    available_cash: float


class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int
    available_cash: float
    market_value: float
    profit_loss: float
    profit_loss_pct: float
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioDetailResponse(PortfolioResponse):
    positions: List[PositionResponse]
