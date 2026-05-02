# SpecForge AI — Phase 2 前端核心與介面整合計畫

在 Phase 1 我們已經完成了穩固的 FastAPI 後端架構（包含資料庫、JWT 認證、專案 CRUD 與 LLM 介面）。
在接下來的 **Phase 2**，我們的核心目標是**讓前端活起來**，完成全局狀態管理、API 串接，並搭建出兼具科技感與實用性的對話式 UI 骨架。

## 前端架構決策

> [!NOTE]
> 經與 User 確認，本專案前端樣式將採用 **Vanilla CSS (純 CSS)** 搭配 CSS Variables 進行開發。
> 此決策旨在保留最大的客製化彈性，以實現高品質的動態特效與玻璃擬物化 (Glassmorphism) 等現代化 AI 平台視覺風格，同時保持 React JSX 結構乾淨。
> 狀態管理使用 `Zustand`，API 請求使用 `fetch` 搭配自訂 Hook。

## Proposed Changes

我們將把開發任務拆解為以下四大模塊：

### 1. 前端全局狀態管理 (Zustand)
處理跨元件的狀態共用，確保資料流動清晰。
#### [NEW] `frontend/src/stores/authStore.js`
- 管理 JWT Token、使用者登入狀態、`currentUser` 資訊。
#### [NEW] `frontend/src/stores/projectStore.js`
- 管理專案列表、目前選取的專案 (`currentProject`)。

### 2. 基礎 API 串接與路由保護 (React Router)
與 Phase 1 的 FastAPI 後端對接。
#### [NEW] `frontend/src/hooks/useApi.js`
- 封裝帶有 Authorization (Bearer Token) 的 `fetch` 請求工具。
#### [MODIFY] `frontend/src/App.jsx` & `frontend/src/main.jsx`
- 實作 React Router 路由表（`/login`, `/register`, `/dashboard`）。
- 實作 `<ProtectedRoute>`，未登入者自動導向登入頁。

### 3. 全局版面配置與核心 UI (Layout & Components)
打造具有科技感、深色模式 (Dark Mode) 的沉浸式介面。
#### [NEW] `frontend/src/index.css` & `frontend/src/App.css`
- 定義全局 CSS 變數（深色系主題、霓虹點綴色、字體）。
#### [NEW] `frontend/src/components/Layout/MainLayout.jsx`
- 左側：專案列表側邊欄 (Sidebar) 與設定入口。
- 右側：主要對話區塊 (Main Content Area)。
#### [NEW] `frontend/src/components/Auth/LoginForm.jsx` & `RegisterForm.jsx`
- 現代化的登入/註冊表單，具備即時錯誤提示。

### 4. SSE (Server-Sent Events) 即時通訊骨架
為未來的 Multi-Agent 對話打底。
#### [NEW] `frontend/src/services/sseClient.js`
- 實作與後端 `/api/projects/{id}/stream` 連接的 EventSource 客戶端。
- 負責接收來自 Agent 的 chunk 訊息並更新到對話 UI。

---

## Verification Plan

### 自動化/開發者測試
1. **認證流程測試**：在瀏覽器中成功註冊新帳號、登入，並觀察 `localStorage` 是否正確存入 Token。
2. **路由攔截測試**：在未登入狀態下強制存取 `/dashboard`，確認是否被正確重導向回 `/login`。
3. **專案連通測試**：在側邊欄成功建立新專案，並確認資料庫 (`specforge.db`) 有正確寫入。

### Manual Verification
請 User 在本地端啟動前後端，實際操作登入介面，並確認 UI 佈景主題、動畫與佈局是否符合預期。
