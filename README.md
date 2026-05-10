# 🔥 SpecForge AI — 規格鍛造爐

> 智慧化 AI 軟體工程顧問平台，透過多智能體協作，主動挖掘使用者的真實商業意圖。
> 
> **Developed by [KennyKang](https://github.com/KennyKang7012)**

## ✨ 核心特色

- **🔍 意圖挖掘** — BA Agent 透過 5 Whys 深層提問，防止 XY 問題
- **📋 自動提案** — PM Agent 自動盤點功能並產出結構化提案
- **🏗️ 架構設計** — Architect Agent 進行技術選型與任務拆解
- **📝 規格撰寫** — Writer Agent 產出 OpenSpec 標準規格文件並自動驗證
- **📦 產出物管理** — 支援各階段文件個別下載及一鍵打包 ZIP 功能
- **🔄 對答式確認** — 每個階段保留人工確認點，確保規格符合真實需求
- **🌐 多 LLM 供應商** — 支援 Ollama / OpenAI / Google Gemini / OpenRouter / Nvidia 切換

## 🏛️ 系統架構

```
┌─────────────────┐     ┌──────────────────────────────────┐
│  React + Vite   │────▶│  Python FastAPI 統一後端          │
│  (Zustand, SSE) │◀────│  ├── JWT 認證 + Query Token 支援 │
│  └─ 產出物面板  │     │  ├── CrewAI 多智能體引擎          │
└─────────────────┘     │  ├── 產出物自動生成與下載         │
                        │  ├── SQLite 資料庫                │
                        │  └── OpenSpec CLI 整合            │
                        └──────────────────────────────────┘
```

## 📁 專案結構

```
spec-forge-ai/
├── backend/                  # 🐍 Python FastAPI 統一後端
│   ├── main.py               # 進入點：生命週期與 CORS 設定
│   ├── api/                  # 路由層：處理請求分發 (Auth, Projects, Settings)
│   ├── core/                 # 核心層：認證 (Security)、資料庫 (DB)、配置 (Config)
│   ├── agents/               # 智能體：CrewAI Agent 與 Task 定義
│   ├── docs/                 # 💾 產出物：Agent 生成的實體 Markdown 檔案
│   └── data/                 # 🗄️ 數據層：SQLite 檔案 (.db) 與系統資料儲存
├── frontend/                 # ⚛️ Vite + React 前端
│   └── src/
│       ├── pages/            # 頁面層：Dashboard, Login, Register
│       ├── components/       # 元件層：ChatArea, FilePanel (產出物面板) 等
│       ├── stores/           # 狀態管理：Zustand (Chat, Project, Auth)
│       ├── hooks/            # 勾子：useSSE (即時通訊), useApi
│       └── services/         # 服務層：API 請求封裝 (Axios)
├── docs/                     # 📚 專案知識庫 (Documentation Base)
│   ├── archive/              # 歷史開發階段歸檔 (Phase Archive)
│   ├── download_system_spec.md   # 技術規格：檔案下載與驗證系統
│   ├── database_config_guide.md  # 技術指南：異步資料庫設定說明
│   └── README.md             # 知識庫總索引
└── .env                      # ⚙️ 環境變數 (LLM API Key, DB URL 等)
```

## 🚀 快速開始

### 前置需求

- Python 3.11+
- Node.js 20.19+
- Ollama（本地 LLM，預設使用 gemma4:31b-cloud）

### 後端啟動

請確認您的終端機位於**專案根目錄** (`spec-forge-ai/`)：

```bash
# 使用 uv run 直接啟動 FastAPI 伺服器 (不需手動 activate 虛擬環境)
PYTHONPATH=. uv run uvicorn backend.main:app --reload --port 8000
```

### 前端啟動

```bash
cd frontend
npm install
npm run dev
```

### 環境變數設定

複製 `.env` 檔案並修改設定：

```bash
# 預設使用 Ollama 本地模型
LLM_PROVIDER=ollama
LLM_MODEL=gemma4:31b-cloud
OLLAMA_BASE_URL=http://localhost:11434/v1
```

## 📖 專案文件庫 (Knowledge Base)

所有的技術文件與開發歸檔均存放於 `docs/` 目錄：

*   **[📚 知識庫總索引](docs/README.md)**
*   **[🏗️ 下載系統技術規格](docs/download_system_spec.md)**
*   **[📜 軟體開發需求規格書 (SRS v2.1)](docs/SRS_v2.0_軟體開發需求規格書.md)**
*   **[📦 Phase 4 歸檔：下載系統優化實錄](docs/archive/Phase_4_DownloadSystem/optimization_summary.md)**

## 🔧 技術棧

| 層級 | 技術 |
|------|------|
| **前端** | React + Vite + Zustand |
| **後端** | Python FastAPI |
| **AI 引擎** | CrewAI (Multi-Agent) |
| **資料庫** | SQLite |
| **LLM** | Ollama (預設) / OpenAI / Gemini / OpenRouter |
| **規格工具** | OpenSpec CLI |
| **部署** | PM2 本機部署 |

## 👤 維護者 (Maintainer)

- **KennyKang** 
    - GitHub: [@KennyKang7012](https://github.com/KennyKang7012)
    - Role: Project Creator & Lead Developer

## 📄 授權

MIT License
