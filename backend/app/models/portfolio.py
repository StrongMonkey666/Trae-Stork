from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, DECIMAL
from sqlalchemy.sql import func
from app.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    total_capital = Column(DECIMAL(15, 2), nullable=False)
    available_cash = Column(DECIMAL(15, 2), nullable=False)
    market_value = Column(DECIMAL(15, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    stock_code = Column(String(20), nullable=False)
    stock_name = Column(String(100))
    quantity = Column(Integer, nullable=False)
    cost_price = Column(DECIMAL(10, 4), nullable=False)
    current_price = Column(DECIMAL(10, 4))
    market_value = Column(DECIMAL(15, 2))
    profit_loss = Column(DECIMAL(15, 2))
    opened_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    position_id = Column(Integer, ForeignKey("positions.id", ondelete="SET NULL"))
    stock_code = Column(String(20), nullable=False)
    stock_name = Column(String(100))
    direction = Column(Enum("buy", "sell"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 4), nullable=False)
    commission = Column(DECIMAL(10, 4), default=0)
    traded_at = Column(DateTime, server_default=func.now())


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class WatchlistStock(Base):
    __tablename__ = "watchlist_stocks"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False)
    stock_code = Column(String(20), nullable=False)
    added_at = Column(DateTime, server_default=func.now())
