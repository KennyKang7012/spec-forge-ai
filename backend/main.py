"""
SpecForge AI — FastAPI 應用進入點
統一後端服務：JWT 認證 + CORS + SSE + Agent 編排
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.auth import router as auth_router
from backend.api.projects import router as projects_router
from backend.api.settings import router as settings_router
from backend.core.config import get_settings
from backend.core.database import init_db


# ── 確保 data 目錄存在 ──────────────────────────────────────────────
DATA_DIR = Path("./data")
PROJECTS_DIR = DATA_DIR / "projects"


def _ensure_directories():
    """確保必要的資料目錄存在"""
    DATA_DIR.mkdir(exist_ok=True)
    PROJECTS_DIR.mkdir(exist_ok=True)


# ── Lifespan（啟動 / 關閉事件） ─────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用生命週期管理"""
    # === Startup ===
    _ensure_directories()
    await init_db()
    settings = get_settings()
    print(f"🔥 SpecForge AI 後端已啟動")
    print(f"   📦 LLM Provider: {settings.llm_provider} ({settings.llm_model})")
    print(f"   🗄️  Database: {settings.database_url}")
    print(f"   🌐 API Docs: http://{settings.app_host}:{settings.app_port}/docs")

    yield

    # === Shutdown ===
    print("🛑 SpecForge AI 後端已關閉")


# ── FastAPI App ─────────────────────────────────────────────────────

app = FastAPI(
    title="SpecForge AI",
    description="智慧化 AI 軟體工程顧問平台 — 透過多智能體協作產出工業級規格文件",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS 中介軟體 ───────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://localhost:3000",    # 備用前端 port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 掛載路由 ────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(settings_router)


# ── 健康檢查端點 ────────────────────────────────────────────────────

@app.get("/api/health", tags=["系統"])
async def health_check():
    """健康檢查端點"""
    settings = get_settings()
    return {
        "status": "ok",
        "version": "0.1.0",
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
    }
