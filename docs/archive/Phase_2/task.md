# SpecForge AI — Phase 2 開發任務追蹤

## 1. 全局狀態管理 (Zustand)
- [x] 建立 `authStore.js` (登入狀態、Token)
- [x] 建立 `projectStore.js` (專案列表、目前專案)

## 2. API 串接與路由
- [x] 實作 `useApi.js` (Fetch 封裝與 Token 攔截)
- [x] 設定 `react-router-dom` 路由表
- [x] 實作 `<ProtectedRoute>` 路由保護
- [x] 實作登入/註冊 API 串接
- [x] 實作專案 CRUD API 串接

## 3. 全局版面配置 (Layout & CSS)
- [x] 設定全局 CSS 變數 (`index.css` / 深色主題 / 玻璃擬物)
- [x] 實作 `MainLayout.jsx` (整體佈局)
- [x] 實作側邊欄 (Sidebar) 元件
- [x] 實作對話區塊 (Main Chat Area) 元件
- [x] 實作登入/註冊畫面 (`LoginForm.jsx`, `RegisterForm.jsx`)

## 4. SSE (Server-Sent Events)
- [x] 實作 `sseClient.js` 工具
- [x] 在前端對接 `/api/projects/{id}/stream` 端點
