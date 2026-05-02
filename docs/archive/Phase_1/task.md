# Phase 1 基礎建設 — 任務追蹤

## Backend Core 模組
- [x] `core/config.py` — Settings 設定管理 (pydantic-settings)
- [x] `core/database.py` — SQLite ORM Models (5 張表) + init_db
- [x] `core/security.py` — JWT 認證 + 密碼 hash
- [x] `core/llm_provider.py` — LLM Provider 抽象層 (6 供應商)

## Backend API 路由
- [x] `api/auth.py` — 註冊 / 登入 路由
- [x] `api/projects.py` — 專案 CRUD + SSE 骨架
- [x] `api/settings.py` — LLM / SKILL 設定路由

## Backend 進入點
- [x] `main.py` — FastAPI app (CORS + 路由掛載 + startup)

## Frontend 初始化
- [x] Vite + React 專案初始化
- [x] 安裝依賴 (zustand, react-router-dom, react-markdown)
- [x] 配置 vite.config.js proxy

## 環境與驗證
- [x] Python 虛擬環境 + 依賴安裝
- [x] 後端啟動驗證
- [x] 健康檢查端點測試
- [x] 前端啟動驗證
