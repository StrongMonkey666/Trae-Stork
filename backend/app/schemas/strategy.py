from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StrategyBase(BaseModel):
    name: str
    description: Optional[str] = None
    code: str
    language: str = "python"


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None


class StrategyResponse(StrategyBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StrategyListResponse(BaseModel):
    items: List[StrategyResponse]
    total: int
    page: int
    page_size: int
