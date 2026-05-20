from pydantic import BaseModel
from typing import List, Optional


class KLineData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    amount: float


class KLineResponse(BaseModel):
    code: str
    name: str
    period: str
    data: List[KLineData]


class RealtimeQuote(BaseModel):
    code: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: float
    amount: float
    open: float
    high: float
    low: float
    close: float
    timestamp: str


class RealtimeResponse(BaseModel):
    data: List[RealtimeQuote]
    updated_at: str


class StockSearchResult(BaseModel):
    code: str
    name: str
    market: str
    industry: Optional[str] = None


class SearchResponse(BaseModel):
    items: List[StockSearchResult]
    total: int
