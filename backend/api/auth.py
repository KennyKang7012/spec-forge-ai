"""
SpecForge AI — 認證 API 路由
提供用戶註冊與登入功能
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import User, get_db
from backend.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["認證"])


# ── Request / Response Schemas ──────────────────────────────────────

class RegisterRequest(BaseModel):
    """註冊請求"""
    username: str = Field(..., min_length=3, max_length=50, description="用戶名稱")
    password: str = Field(..., min_length=6, max_length=100, description="密碼")
    display_name: str | None = Field(None, max_length=100, description="顯示名稱")
    preferred_lang: str = Field("zh-TW", description="偏好語言")


class LoginRequest(BaseModel):
    """登入請求"""
    username: str = Field(..., description="用戶名稱")
    password: str = Field(..., description="密碼")


class TokenResponse(BaseModel):
    """Token 回應"""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    """用戶資訊回應"""
    id: int
    username: str
    display_name: str | None
    preferred_lang: str

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """通用訊息回應"""
    message: str


# ── Endpoints ───────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="用戶註冊",
)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    註冊新用戶

    - **username**: 唯一用戶名稱（3-50 字元）
    - **password**: 密碼（最少 6 字元）
    - **display_name**: 顯示名稱（可選）
    - **preferred_lang**: 偏好語言（預設 zh-TW）
    """
    # 檢查用戶名是否已存在
    result = await db.execute(select(User).where(User.username == request.username))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"用戶名稱 '{request.username}' 已被使用",
        )

    # 建立新用戶
    new_user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        display_name=request.display_name or request.username,
        preferred_lang=request.preferred_lang,
    )
    db.add(new_user)
    await db.flush()

    return MessageResponse(message="註冊成功")


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="用戶登入",
)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    用戶登入，驗證成功後回傳 JWT access token

    - **username**: 用戶名稱
    - **password**: 密碼
    """
    # 查詢用戶
    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶名稱或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 更新最後登入時間
    user.last_login = datetime.now(timezone.utc)

    # 建立 JWT token
    access_token = create_access_token(data={"sub": user.username})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="取得當前用戶資訊",
)
async def get_me(current_user: User = Depends(get_current_user)):
    """取得當前登入用戶的資訊（需要 JWT token）"""
    return UserResponse.model_validate(current_user)
