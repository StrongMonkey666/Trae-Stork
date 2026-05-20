from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.strategy import Strategy
from app.schemas.strategy import StrategyCreate, StrategyUpdate, StrategyResponse, StrategyListResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/strategies", tags=["策略管理"])


@router.get("", response_model=StrategyListResponse)
async def list_strategies(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Strategy).filter(Strategy.user_id == current_user.id)

    if status_filter:
        query = query.filter(Strategy.status == status_filter)

    total = query.count()
    strategies = query.order_by(Strategy.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return StrategyListResponse(
        items=strategies,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=StrategyResponse, status_code=status.HTTP_201_CREATED)
async def create_strategy(
    strategy_data: StrategyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_strategy = Strategy(
        user_id=current_user.id,
        name=strategy_data.name,
        description=strategy_data.description,
        code=strategy_data.code,
        language=strategy_data.language
    )

    db.add(new_strategy)
    db.commit()
    db.refresh(new_strategy)

    return new_strategy


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    strategy = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id
    ).first()

    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="策略不存在"
        )

    return strategy


@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(
    strategy_id: int,
    strategy_data: StrategyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    strategy = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id
    ).first()

    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="策略不存在"
        )

    update_data = strategy_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(strategy, key, value)

    db.commit()
    db.refresh(strategy)

    return strategy


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    strategy = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id
    ).first()

    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="策略不存在"
        )

    db.delete(strategy)
    db.commit()
