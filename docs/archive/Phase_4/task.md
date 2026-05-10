# Phase 4：前端介面開發 — 任務清單

## 模組 A：設計系統重構
- [x] 修正 `index.css` 移除 Vite 模板殘留樣式與未使用的淺色變數
- [x] 新增完整 design tokens（Agent 角色色、間距、動畫、圓角、z-index）
- [x] 新增全域動畫 keyframes 與 scrollbar 美化

## 模組 B：對話式 UI 核心
- [x] 安裝新依賴（react-syntax-highlighter, remark-gfm, lucide-react, react-hot-toast）
- [x] 新增 `chatStore.js` 對話狀態管理
- [x] 新增 `useSSE.js` hook（從 ChatArea 抽離 SSE 邏輯）
- [x] 修改 `sseClient.js` 擴充事件監聽
- [x] 新增 `Chat.css` 對話樣式
- [x] 新增 `MessageBubble.jsx` 訊息氣泡元件
- [x] 新增 `MessageList.jsx` 訊息列表元件
- [x] 新增 `TypingIndicator.jsx` Agent 思考指示器
- [x] 新增 `ChatInput.jsx` 輸入區塊元件
- [x] 新增 `PhaseProgress.jsx` 五階段進度條
- [x] 重構 `ChatArea.jsx` 為容器元件
- [x] 修改 `Layout.css` 移出 chat 樣式

## 模組 C：專案管理增強
- [x] 新增 `CreateProjectModal.jsx` 專案建立模態框
- [x] 修改 `Sidebar.jsx` 增強操作能力
- [x] 新增 `ProjectVersions.jsx` 版本歷程面板
- [x] 新增 `Project.css` 專案管理樣式
- [x] 修改 `App.jsx` 新增路由

## 模組 D：設定頁面
- [x] 新增 `SettingsPage.jsx` 設定頁面容器
- [x] 新增 `LLMSettings.jsx` LLM 供應商設定面板
- [x] 新增 `SkillSettings.jsx` SKILL 對答設定面板
- [x] 新增 `Settings.css` 設定頁面樣式

## 模組 E：檔案預覽與下載
- [x] 新增 `FilePanel.jsx` 檔案面板
- [x] 新增 `FilePreview.jsx` 檔案預覽模態框
- [x] 新增 `Files.css` 檔案面板樣式

## 驗證
- [x] `npm run build` 編譯驗證（零錯誤）
- [x] 瀏覽器整合測試（Login/Register 頁面視覺驗證通過）
- [x] 撰寫 walkthrough
