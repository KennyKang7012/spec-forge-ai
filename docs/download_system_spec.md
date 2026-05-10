# SpecForge AI — 階段性產出物管理與一鍵下載系統開發需求文件

## 1. 需求背景 (Background)
在多智能體 (Multi-Agent) 協作過程中，系統會分階段產出不同的技術文件。使用者需要一個集中的介面來查看這些文件、進行個別下載，或在任務結束後一鍵打包所有產出物。

## 2. 功能範疇 (Feature Scope)

### A. 階段性檔案自動生成 (Backend Logic)
*   **檔案命名規範**：檔案名稱必須包含專案 ID 作為後綴（如 `intent_report_3.md`），以防止多專案併行時在伺服器端發生檔案覆寫。
*   **實體儲存路徑**：所有產出物統一存放於 `backend/docs/` 目錄下。
*   **資料庫同步**：每當 Agent 完成一階段任務並寫入檔案後，必須同步更新 `project_files` 資料表（包含檔名、顯示名稱、檔案大小、路徑等）。

### B. 個別檔案下載系統 (Individual Download)
*   **URL 結構**：`/api/projects/{project_id}/files/{filename}`。
*   **安全性 (Authentication)**：支援 JWT Token 驗證。考量到原生下載連結的限制，系統必須同時支援從 Header (Authorization) 與 URL Query String (?token=) 讀取認證資訊。
*   **傳輸標頭 (Headers)**：
    *   `Content-Type`: `application/octet-stream` (強制瀏覽器進入下載模式)。
    *   `Content-Disposition`: `attachment; filename="{quoted_name}"` (確保檔名相容性)。

### C. 一鍵打包下載系統 (Download All - ZIP)
*   **打包範圍**：自動掃描該專案 ID 對應的所有 Markdown (.md) 文件。
*   **動態壓縮**：後端接收請求後，即時使用 `zipfile` 模組將檔案壓縮至記憶體流中傳回，不產生暫時性的實體 ZIP 檔案以節省空間。
*   **ZIP 命名格式**：`SpecForge_Project_{id}_{ProjectName}.zip`。

### D. 前端管理面板 (File Panel UI)
*   **懸浮視窗設計**：採用 Glassmorphism（玻璃擬態）風格，位於畫面右側，可隨時開啟或關閉。
*   **檔案列表**：
    *   顯示各階段檔案圖示 (FileText)、顯示名稱與檔案大小。
    *   每個檔案附帶獨立的「下載」連結。
*   **底部操作區**：固定顯示「打包下載全部 (ZIP)」按鈕。
*   **技術實作**：使用原生 `<a>` 標籤配合 `download` 屬性，確保下載行為不受 JavaScript 導覽攔截。

## 3. 非功能性需求 (Non-functional Requirements)
*   **跨瀏覽器相容性**：確保在 Chrome, Safari, Edge 均能正確識別檔名，不出現 UUID 隨機檔名。
*   **效能優化**：大檔案下載時應使用 `FileResponse` (Streaming) 以降低記憶體佔用。
*   **安全性**：下載連結必須帶有時效性的 Token，防止非授權存取檔案。

---
**存檔日期**：2026-05-10
**負責人員**：SpecForge AI Dev Team
