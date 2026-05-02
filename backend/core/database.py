"""
SpecForge AI — SQLite 資料庫 ORM 定義
對應 SRS v2.0 §6.4 ER Diagram 的 5 張表
使用 SQLAlchemy 2.0 async 風格
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from backend.core.config import get_settings


# ── Base ────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """SQLAlchemy ORM 基底類別"""
    pass


# ── Models ──────────────────────────────────────────────────────────

class User(Base):
    """用戶表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    preferred_lang = Column(String(10), default="zh-TW")
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)

    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    skill_configs = relationship("SkillConfig", back_populates="user", cascade="all, delete-orphan")
    llm_configs = relationship("LLMConfig", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """專案表"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="created")  # created, in_progress, completed, error
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="projects")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")


class ProjectVersion(Base):
    """專案版本歷程表"""
    __tablename__ = "project_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    version_tag = Column(String(50), nullable=False)  # e.g. "v1.0", "v1.1"
    change_summary = Column(Text, nullable=True)
    files_snapshot_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    project = relationship("Project", back_populates="versions")


class SkillConfig(Base):
    """SKILL 對答問題配置表"""
    __tablename__ = "skill_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)  # e.g. "SKILL-01_intent_discovery"
    custom_questions_json = Column(Text, nullable=True)  # JSON string
    max_rounds = Column(Integer, default=7)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="skill_configs")


class LLMConfig(Base):
    """LLM 供應商配置表"""
    __tablename__ = "llm_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # ollama, openai, google, openrouter, nvidia, custom
    model_name = Column(String(100), nullable=False)
    api_key_encrypted = Column(String(500), nullable=True)
    base_url = Column(String(500), nullable=True)
    is_default = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="llm_configs")


# ── Engine & Session ────────────────────────────────────────────────

_engine = None
_async_session_factory = None


def _get_engine():
    """取得或建立 async engine（延遲初始化）"""
    global _engine
    if _engine is None:
        settings = get_settings()
        # 將 .env 的 sqlite:/// 轉換為 async 版本 sqlite+aiosqlite:///
        db_url = settings.database_url
        if db_url.startswith("sqlite:///"):
            db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        _engine = create_async_engine(
            db_url,
            echo=settings.app_debug,
            future=True,
        )
    return _engine


def _get_session_factory():
    """取得或建立 async session factory"""
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = async_sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_factory


async def init_db():
    """初始化資料庫 — 建立所有表格（若不存在）"""
    engine = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """FastAPI 依賴注入 — 取得 async DB session"""
    session_factory = _get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
