# Phase 1 基礎建設 — 實作計畫

> 對應 SRS v2.0 §9 開發里程碑 Phase 1，涵蓋後端框架、資料庫、LLM 抽象層、前端專案初始化。

## 概述

目前專案已有目錄結構與空白檔案（scaffold），所有 `.py` / `.jsx` 檔案皆為空。Phase 1 目標是將這些空白檔案填充為**可運行的基礎框架**，使後續 Phase 2-5 可在此基礎上疊加功能。

---

## Proposed Changes

### 1. Backend 核心設定 (core/)

#### [NEW] `backend/core/config.py`
- 使用 `pydantic-settings` 建立統一的 `Settings` 類別
- 從 `.env` 讀取所有環境變數（JWT、LLM、DB、App 設定）
- 提供 `get_settings()` 依賴注入函式

#### [MODIFY] `backend/core/database.py`
- 使用 SQLAlchemy 2.0 async 風格
- 建立 `AsyncEngine` + `async_sessionmaker`
- 定義 5 張 ORM Model（對應 SRS §6.4 ER 圖）：
  - `User`（id, username, password_hash, display_name, preferred_lang, created_at, last_login）
  - `Project`（id, user_id, name, description, status, created_at, updated_at）
  - `ProjectVersion`（id, project_id, version_tag, change_summary, files_snapshot_path, created_at）
  - `SkillConfig`（id, user_id, skill_name, custom_questions_json, max_rounds, updated_at）
  - `LLMConfig`（id, user_id, provider, model_name, api_key_encrypted, base_url, is_default）
- 提供 `init_db()` 建表函式 + `get_db()` session 依賴注入

#### [MODIFY] `backend/core/security.py`
- JWT token 建立與驗證（`create_access_token`, `verify_token`）
- 密碼 hash / verify（使用 passlib bcrypt）
- `get_current_user` FastAPI 依賴注入

#### [MODIFY] `backend/core/llm_provider.py`
- `LLMProvider` 抽象基底類別（定義 `chat()` / `stream_chat()` 介面）
- 具體實作：`OllamaProvider`, `OpenAIProvider`, `GoogleProvider`, `OpenRouterProvider`, `NvidiaProvider`, `CustomProvider`
- 所有 OpenAI 兼容供應商使用 `openai` SDK，僅需切換 `base_url` + `api_key`
- `LLMProviderFactory.create(provider_name)` 工廠方法
- `get_llm_provider()` 依賴注入

---

### 2. Backend API 路由 (api/)

#### [MODIFY] `backend/api/auth.py`
- `POST /api/auth/register` — 註冊（username + password + display_name）
- `POST /api/auth/login` — 登入（回傳 JWT access_token）
- Pydantic request/response schemas

#### [MODIFY] `backend/api/projects.py`
- `POST /api/projects` — 建立新專案
- `GET /api/projects` — 列出使用者所有專案
- `GET /api/projects/{id}` — 取得專案詳情
- `GET /api/projects/{id}/stream` — SSE 串流端點（Phase 1 先建立骨架）
- Pydantic schemas + JWT 依賴保護

#### [MODIFY] `backend/api/settings.py`
- `GET /api/settings/llm` — 取得目前 LLM 設定
- `PUT /api/settings/llm` — 更新 LLM 供應商設定
- `GET /api/settings/skills` — 取得 SKILL 對答設定
- `PUT /api/settings/skills/{name}` — 更新 SKILL 問題配置

---

### 3. Backend 進入點

#### [MODIFY] `backend/main.py`
- FastAPI app 初始化（title, version, description）
- CORS 中介軟體（允許前端 `localhost:5173`）
- 掛載 3 個路由器（auth, projects, settings）
- `@app.on_event("startup")` 呼叫 `init_db()` 建表
- 健康檢查端點 `GET /api/health`

---

### 4. 前端專案初始化 (frontend/)

#### [NEW] `frontend/package.json` + Vite 設定
- 使用 `npx create-vite` 初始化 React 專案
- 安裝依賴：`zustand`, `react-router-dom`, `react-markdown`
- 配置 `vite.config.js` proxy 至 `localhost:8000`

> [!NOTE]
> 前端在 Phase 1 僅做**基礎初始化**，不包含完整 UI。會建立最小可運行的 App shell，驗證前後端連通性。

---

### 5. Python 虛擬環境

- 使用 `uv` 建立 `.venv` 並安裝 `requirements.txt` 依賴
- 驗證 `uvicorn` 可正常啟動 FastAPI

---

## User Review Required

> [!IMPORTANT]
> **前端框架選擇**：SRS 指定 Vite + React。Phase 1 會使用 `npx create-vite` 初始化 React (JavaScript) 專案。如果您偏好 TypeScript，請告知。

> [!IMPORTANT]
> **Python 版本**：將使用 `uv` 管理虛擬環境。請確認您系統上已安裝 Python 3.11+ 和 `uv`。

---

## Verification Plan

### Automated Tests
1. **後端啟動測試**：`uvicorn backend.main:app --reload` 可正常啟動，無 import error
2. **健康檢查**：`curl http://localhost:8000/api/health` 回傳 `{"status": "ok"}`
3. **資料庫建表**：啟動時自動建立 SQLite 資料庫 + 5 張表
4. **API 端點測試**：透過 FastAPI `/docs` Swagger UI 測試 auth/projects/settings 端點
5. **LLM Provider 測試**：驗證 Ollama provider 初始化（不需真正呼叫 LLM）
6. **前端啟動**：`npm run dev` 可正常啟動，瀏覽器可見 React 預設頁面

### Manual Verification
- 確認 `.env` 載入正確
- 確認 SQLite DB 檔案建立在 `./data/specforge.db`
