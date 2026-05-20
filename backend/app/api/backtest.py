from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.strategy import Strategy
from app.models.backtest import BacktestRecord
from app.schemas.backtest import BacktestCreate, BacktestResponse, BacktestResultResponse
from app.core.security import get_current_user
from app.utils.backtest_engine import BacktestEngine
from app.utils.akshare_helper import AkShareHelper
from datetime import datetime

router = APIRouter(prefix="/backtest", tags=["回测分析"])


@router.post("", response_model=dict)
async def create_backtest(
    backtest_data: BacktestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    strategy = db.query(Strategy).filter(
        Strategy.id == backtest_data.strategy_id,
        Strategy.user_id == current_user.id
    ).first()

    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="策略不存在"
        )

    new_record = BacktestRecord(
        user_id=current_user.id,
        strategy_id=backtest_data.strategy_id,
        start_date=backtest_data.start_date,
        end_date=backtest_data.end_date,
        initial_capital=backtest_data.initial_capital,
        commission_rate=backtest_data.commission_rate,
        status="running"
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {
        "task_id": new_record.id,
        "status": "running",
        "message": "回测任务已创建，正在执行..."
    }


@router.get("/{task_id}", response_model=BacktestResponse)
async def get_backtest_status(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(BacktestRecord).filter(
        BacktestRecord.id == task_id,
        BacktestRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="回测记录不存在"
        )

    return BacktestResponse(
        id=record.id,
        strategy_id=record.strategy_id,
        start_date=record.start_date,
        end_date=record.end_date,
        initial_capital=float(record.initial_capital),
        final_capital=float(record.final_capital) if record.final_capital else None,
        total_return=float(record.total_return) if record.total_return else None,
        annual_return=float(record.annual_return) if record.annual_return else None,
        sharpe_ratio=float(record.sharpe_ratio) if record.sharpe_ratio else None,
        max_drawdown=float(record.max_drawdown) if record.max_drawdown else None,
        win_rate=float(record.win_rate) if record.win_rate else None,
        status=record.status,
        created_at=record.created_at,
        completed_at=record.completed_at
    )


@router.get("/{task_id}/result", response_model=BacktestResultResponse)
async def get_backtest_result(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(BacktestRecord).filter(
        BacktestRecord.id == task_id,
        BacktestRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="回测记录不存在"
        )

    if record.status == "running":
        return BacktestResultResponse(
            summary={},
            equity_curve=[],
            trades=[],
            positions=[]
        )

    strategy = db.query(Strategy).filter(Strategy.id == record.strategy_id).first()

    kline_data = AkShareHelper.get_kline_data(
        code="000001.SZ",
        start_date=record.start_date.strftime('%Y%m%d'),
        end_date=record.end_date.strftime('%Y%m%d')
    )

    engine = BacktestEngine({
        'initial_capital': float(record.initial_capital),
        'commission_rate': float(record.commission_rate),
        'slippage': 0.001,
        'stock': '000001.SZ'
    })

    if kline_data:
        engine.set_data(kline_data)

    results = engine.execute_strategy(strategy.code if strategy else "")

    if record.status != "completed":
        record.status = "completed"
        record.final_capital = results['summary']['final_capital']
        record.total_return = results['summary']['total_return']
        record.annual_return = results['summary']['annual_return']
        record.sharpe_ratio = results['summary']['sharpe_ratio']
        record.max_drawdown = results['summary']['max_drawdown']
        record.win_rate = results['summary']['win_rate']
        record.total_trades = results['summary']['total_trades']
        record.performance_data = results
        record.completed_at = datetime.utcnow()

        db.commit()

    return BacktestResultResponse(**results)
