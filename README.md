# 🔥 SpecForge AI — 規格鍛造爐

> 智慧化 AI 軟體工程顧問平台，透過多智能體協作，主動挖掘使用者的真實商業意圖，產出符合 OpenSpec 規範的工業級規格文件。

## ✨ 核心特色

- **🔍 意圖挖掘** — BA Agent 透過 5 Whys 深層提問，防止 XY 問題
- **📋 自動提案** — PM Agent 自動盤點功能並產出結構化提案
- **🏗️ 架構設計** — Architect Agent 進行技術選型與任務拆解
- **📝 規格撰寫** — Writer Agent 產出 OpenSpec 標準規格文件並自動驗證
- **🔄 對答式確認** — 每個階段保留人工確認點，確保規格符合真實需求
- **🌐 多 LLM 供應商** — 支援 Ollama / OpenAI / Google Gemini / OpenRouter / Nvidia 切換

## 🏛️ 系統架構

```
┌─────────────────┐     ┌──────────────────────────────────┐
│  React + Vite   │────▶│  Python FastAPI 統一後端          │
│  (Zustand, SSE) │◀────│  ├── JWT 認證                    │
└─────────────────┘     │  ├── CrewAI 多智能體引擎          │
                        │  │   ├── BA Agent (意圖分析)      │
                        │  │   ├── PM Agent (需求提案)      │
                        │  │   ├── Architect Agent (架構)   │
                        │  │   └── Writer Agent (規格撰寫)  │
                        │  ├── LLM Provider 抽象層          │
                        │  ├── SQLite 資料庫                │
                        │  └── OpenSpec CLI 整合            │
                        └──────────────────────────────────┘
```

## 📁 專案結構

```
spec-forge-ai/
├── .env                      # 環境變數（LLM API Key 等）
├── docs/                     # 專案文件
├── data/                     # 產出物永久儲存
├── frontend/                 # Vite + React 前端
│   └── src/
│       ├── components/       # UI 元件
│       ├── stores/           # Zustand 狀態管理
│       ├── hooks/            # 自訂 Hooks (SSE 等)
│       └── services/         # API 呼叫層
└── backend/                  # Python FastAPI 統一後端
    ├── main.py               # FastAPI 進入點
    ├── api/                  # API 路由
    ├── core/                 # 核心邏輯（DB, Auth, LLM）
    ├── agents/               # CrewAI Agent 定義
    ├── tools/                # Agent 工具
    └── config/               # 設定檔
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

## 📖 文件

- [軟體開發需求規格書 (SRS v2.1)](docs/SRS_v2.0_軟體開發需求規格書.md)
- [OpenSpec CLI 安裝與操作指南](docs/OpenSpec_CLI_安裝與操作指南.md)

## 📄 授權

MIT License
