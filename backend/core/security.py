"""
SpecForge AI — JWT 認證與密碼安全模組
提供 token 建立/驗證、密碼 hash/verify、FastAPI 依賴注入
"""

from datetime import datetime, timedelta, timezone

import bcrypt
from typing import Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import get_settings
from backend.core.database import User, get_db

# ── 密碼 Hashing（直接使用 bcrypt，避免 passlib 相容性問題） ────────


def hash_password(password: str) -> str:
    """將明文密碼轉為 bcrypt hash"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證明文密碼是否匹配 hash"""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ── JWT Token ───────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    建立 JWT access token

    Args:
        data: payload 資料，通常包含 {"sub": username}
        expires_delta: 過期時間，預設從 settings 讀取
    """
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    驗證 JWT token 並回傳 payload

    Raises:
        HTTPException: token 無效或過期
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證憑證",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── FastAPI 依賴注入 ────────────────────────────────────────────────

# auto_error=False 讓我們能手動處理 Query Token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    token_query: str | None = Query(None, alias="token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI 依賴注入 — 從 JWT token 取得當前登入用戶
    支援 Authorization Header 或 Query String (?token=...)
    """
    final_token = token or token_query
    
    if not final_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="請先登入以取得認證憑證",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(final_token)
    username: str | None = payload.get("sub")

    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證憑證",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
