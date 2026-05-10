# Phase 4 開發回顧與技術沉澱 (Retrospective)

## 1. 遭遇問題與解決方案 (Problems & Solutions)

### 1.1 多執行緒事件迴圈衝突 (Critical)
*   **問題描述**：CrewAI 在背景執行緒執行任務時，試圖呼叫 `asyncio.get_event_loop()`，導致系統拋出 `RuntimeError: There is no current event loop in thread` 錯誤，造成 SSE 訊息無法推播甚至後端崩潰。
*   **解決方案**：
    *   在 `ProjectSession` 實例化時主動捕捉主執行緒的 `loop`。
    *   實作 `enqueue_sse_event_sync` 方法，透過 `loop.call_soon_threadsafe` 將背景執行緒的訊息安全地送回主迴圈。
    *   這確保了 Agent 的思考過程能穩定且即時地在前端 UI 呈現。

### 1.2 檔案路徑遞迴 Bug
*   **問題描述**：在結合絕對路徑與 `os.path.join` 時出現邏輯錯誤，導致檔案被存放在極深且重複的目錄中（例如 `backend/Users/kennykang/...`）。
*   **解決方案**：
    *   簡化路徑管理邏輯，採用穩定的相對路徑（Relative Path），並強制在執行前檢查 `os.makedirs`。
    *   手動修復已產生文件的位置，並確保後續 Agent 產出路徑與預期一致。

### 1.3 側邊欄事件冒泡衝突
*   **問題描述**：在 Sidebar 點擊「刪除專案」按鈕時，會同時觸發「選取專案」的路由導向，導致刪除確認框閃現即逝。
*   **解決方案**：
    *   將刪除按鈕徹底從原本的 `li` 容器中物理分離，或使用 `e.stopPropagation()` 阻斷事件傳遞。
    *   優化了 React 的狀態更新時機，確保刪除後 UI 能即時響應。

---

## 2. 新增計畫與功能 (Added Features)

### 2.1 對話紀錄持久化 (Full Persistence)
*   **原計畫**：僅在前端 Session 內保留，重新整理即消失。
*   **調整後**：實作了後端資料庫存儲。每一則訊息不論是 Agent 的提問或 User 的回答，都會在產出的瞬間同步存入 SQLite。
*   **價值**：極大地提升了工具的實用性，使用者可以隨時回溯過去的專案對話。

### 2.2 UI 呼吸燈狀態追蹤
*   **新增**：為「意圖挖掘」、「需求提案」等五個階段實作了動態高亮動畫 (PhaseGlow)。
*   **價值**：提升了「AI 正在作業中」的視覺回饋感，減少使用者的焦慮。

---

## 3. 修正路線與未來計畫 (Roadmap Adjustments)

### 3.1 規格文件的多階段產出
*   **修正**：原本計畫只產出一份最終文件，後來決定採取「多階段產出 (Multi-step Output)」策略。
*   **原因**：每一位 Agent（BA, PM, Architect）的專業產出都有其參考價值，拆分後方便使用者進行微調，而非僅依賴最後一份成品。

### 3.2 Phase 5 的優先序調整
*   **調整**：將 **「OpenSpec 格式校驗」** 的優先序提高。
*   **原因**：隨著文件產出功能的穩定，我們發現確保生成的 Markdown 檔案符合標準化規格，是接下來進入自動化開發的關鍵。

---
*紀錄時間：2026-05-10*
