from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Enum, DECIMAL, JSON
from sqlalchemy.sql import func
from app.database import Base


class BacktestRecord(Base):
    __tablename__ = "backtest_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    initial_capital = Column(DECIMAL(15, 2), nullable=False)
    final_capital = Column(DECIMAL(15, 2))
    total_return = Column(DECIMAL(10, 4))
    annual_return = Column(DECIMAL(10, 4))
    sharpe_ratio = Column(DECIMAL(10, 4))
    max_drawdown = Column(DECIMAL(10, 4))
    win_rate = Column(DECIMAL(5, 4))
    total_trades = Column(Integer, default=0)
    performance_data = Column(JSON)
    status = Column(Enum("running", "completed", "failed"), default="running")
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)
