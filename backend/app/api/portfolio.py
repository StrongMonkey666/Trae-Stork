from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio, Position, Trade
from app.schemas.portfolio import (
    PortfolioCreate, PortfolioResponse, PortfolioDetailResponse,
    PositionCreate, PositionResponse,
    TradeCreate, TradeResponse
)
from app.core.security import get_current_user
from app.utils.akshare_helper import AkShareHelper

router = APIRouter(prefix="/portfolio", tags=["组合管理"])


@router.get("", response_model=List[PortfolioResponse])
async def list_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()

    result = []
    for p in portfolios:
        positions = db.query(Position).filter(Position.portfolio_id == p.id).all()
        market_value = sum(float(pos.market_value or 0) for pos in positions)
        cost_value = sum(float(pos.quantity) * float(pos.cost_price) for pos in positions)
        profit_loss = market_value - cost_value
        profit_loss_pct = (profit_loss / cost_value * 100) if cost_value > 0 else 0

        result.append(PortfolioResponse(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            total_capital=float(p.total_capital),
            available_cash=float(p.available_cash),
            market_value=market_value,
            profit_loss=profit_loss,
            profit_loss_pct=profit_loss_pct,
            created_at=p.created_at
        ))

    return result


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data.name,
        total_capital=portfolio_data.total_capital,
        available_cash=portfolio_data.available_cash
    )

    db.add(new_portfolio)
    db.commit()
    db.refresh(new_portfolio)

    return PortfolioResponse(
        id=new_portfolio.id,
        user_id=new_portfolio.user_id,
        name=new_portfolio.name,
        total_capital=float(new_portfolio.total_capital),
        available_cash=float(new_portfolio.available_cash),
        market_value=0,
        profit_loss=0,
        profit_loss_pct=0,
        created_at=new_portfolio.created_at
    )


@router.get("/{portfolio_id}", response_model=PortfolioDetailResponse)
async def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="组合不存在"
        )

    positions = db.query(Position).filter(Position.portfolio_id == portfolio_id).all()

    position_responses = []
    market_value = 0
    cost_value = 0

    for pos in positions:
        stock_name = AkShareHelper.get_stock_name(pos.stock_code)
        quotes = AkShareHelper.get_realtime_quotes([pos.stock_code])

        current_price = quotes[0]['price'] if quotes else float(pos.current_price or pos.cost_price)
        pos_market_value = float(pos.quantity) * current_price
        pos_cost_value = float(pos.quantity) * float(pos.cost_price)
        profit_loss = pos_market_value - pos_cost_value
        profit_loss_pct = (profit_loss / pos_cost_value * 100) if pos_cost_value > 0 else 0

        position_responses.append(PositionResponse(
            id=pos.id,
            portfolio_id=pos.portfolio_id,
            stock_code=pos.stock_code,
            stock_name=stock_name,
            quantity=pos.quantity,
            cost_price=float(pos.cost_price),
            current_price=current_price,
            market_value=pos_market_value,
            profit_loss=profit_loss,
            profit_loss_pct=profit_loss_pct,
            opened_at=pos.opened_at
        ))

        market_value += pos_market_value
        cost_value += pos_cost_value

    total_profit_loss = market_value - cost_value
    total_profit_loss_pct = (total_profit_loss / cost_value * 100) if cost_value > 0 else 0

    return PortfolioDetailResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        total_capital=float(portfolio.total_capital),
        available_cash=float(portfolio.available_cash),
        market_value=market_value,
        profit_loss=total_profit_loss,
        profit_loss_pct=total_profit_loss_pct,
        created_at=portfolio.created_at,
        positions=position_responses
    )


@router.get("/{portfolio_id}/positions", response_model=List[PositionResponse])
async def list_positions(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="组合不存在"
        )

    positions = db.query(Position).filter(Position.portfolio_id == portfolio_id).all()

    return [
        PositionResponse(
            id=pos.id,
            portfolio_id=pos.portfolio_id,
            stock_code=pos.stock_code,
            stock_name=pos.stock_name or AkShareHelper.get_stock_name(pos.stock_code),
            quantity=pos.quantity,
            cost_price=float(pos.cost_price),
            current_price=float(pos.current_price or pos.cost_price),
            market_value=float(pos.market_value or (pos.quantity * float(pos.cost_price))),
            profit_loss=float(pos.profit_loss or 0),
            profit_loss_pct=float(pos.profit_loss) / (pos.quantity * float(pos.cost_price)) * 100 if pos.quantity > 0 else 0,
            opened_at=pos.opened_at
        )
        for pos in positions
    ]


@router.post("/{portfolio_id}/positions", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def add_position(
    portfolio_id: int,
    position_data: PositionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="组合不存在"
        )

    cost = position_data.quantity * position_data.cost_price
    if cost > float(portfolio.available_cash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="可用资金不足"
        )

    new_position = Position(
        portfolio_id=portfolio_id,
        stock_code=position_data.stock_code,
        stock_name=position_data.stock_name or AkShareHelper.get_stock_name(position_data.stock_code),
        quantity=position_data.quantity,
        cost_price=position_data.cost_price,
        current_price=position_data.cost_price,
        market_value=cost
    )

    portfolio.available_cash = Decimal(str(float(portfolio.available_cash) - cost))
    portfolio.market_value = Decimal(str(float(portfolio.market_value) + cost))

    db.add(new_position)
    db.commit()
    db.refresh(new_position)
    db.refresh(portfolio)

    return PositionResponse(
        id=new_position.id,
        portfolio_id=new_position.portfolio_id,
        stock_code=new_position.stock_code,
        stock_name=new_position.stock_name,
        quantity=new_position.quantity,
        cost_price=float(new_position.cost_price),
        current_price=float(new_position.current_price),
        market_value=float(new_position.market_value),
        profit_loss=0,
        profit_loss_pct=0,
        opened_at=new_position.opened_at
    )


@router.get("/{portfolio_id}/trades")
async def list_trades(
    portfolio_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="组合不存在"
        )

    trades = db.query(Trade).filter(
        Trade.portfolio_id == portfolio_id
    ).order_by(Trade.traded_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    total = db.query(Trade).filter(Trade.portfolio_id == portfolio_id).count()

    return {
        'items': [
            TradeResponse(
                id=t.id,
                portfolio_id=t.portfolio_id,
                position_id=t.position_id,
                stock_code=t.stock_code,
                stock_name=t.stock_name,
                direction=t.direction,
                quantity=t.quantity,
                price=float(t.price),
                commission=float(t.commission),
                traded_at=t.traded_at
            )
            for t in trades
        ],
        'total': total,
        'page': page,
        'page_size': page_size
    }


@router.post("/{portfolio_id}/trades", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
async def create_trade(
    portfolio_id: int,
    trade_data: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="组合不存在"
        )

    new_trade = Trade(
        portfolio_id=portfolio_id,
        stock_code=trade_data.stock_code,
        stock_name=trade_data.stock_name or AkShareHelper.get_stock_name(trade_data.stock_code),
        direction=trade_data.direction,
        quantity=trade_data.quantity,
        price=trade_data.price,
        commission=trade_data.commission
    )

    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)

    return TradeResponse(
        id=new_trade.id,
        portfolio_id=new_trade.portfolio_id,
        position_id=new_trade.position_id,
        stock_code=new_trade.stock_code,
        stock_name=new_trade.stock_name,
        direction=new_trade.direction,
        quantity=new_trade.quantity,
        price=float(new_trade.price),
        commission=float(new_trade.commission),
        traded_at=new_trade.traded_at
    )
