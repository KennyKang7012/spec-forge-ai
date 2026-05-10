# SpecForge AI — Phase 4：下載系統優化實錄 (歸檔)

## 1. 任務目標 (Objective)
解決 SpecForge AI 產出物在下載時發生的「檔名遺失」與「下載無反應」問題。確保所有產出物（Markdown 與 ZIP）在所有瀏覽器中均能以正確的檔名（包含專案 ID 與中文名稱）下載並保存。

## 2. 遇到的技術困難 (Challenges)

### A. 檔名被 Chrome 識別為 UUID
*   **現象**：下載後的檔案在下載記錄中顯示為 `35c61693-6dfc-4f25-a0ab-f397bdfe78d1` 之類的隨機字串。
*   **原因**：原本使用 JavaScript 的 `fetch` 取得數據後轉換為 `blob:` URL，這種方式會被部分瀏覽器（或帶有特定 Service Worker 的環境）攔截，導致後端傳回的 `Content-Disposition` 標頭遺失，瀏覽器因無法取得檔名而自動生成 UUID。

### B. 下載連結身份驗證 (Authorization)
*   **現象**：直接導航至下載 URL 會觸發 401 Unauthorized。
*   **原因**：傳統的檔案下載連結無法透過 Header 傳送 `Authorization: Bearer <token>`。

### C. 代理伺服器 (Vite Proxy) 干擾
*   **現象**：在開發環境下，請求經過 Vite 代理伺服器轉發時，標頭有時會被過濾或修改。

## 3. 解決方案與實作 (Solutions)

### 第一步：後端支援 Query Token 驗證
*   修改 `backend/core/security.py`，讓 `get_current_user` 依賴項除了支援 Header 驗證，也支援從 URL 參數讀取 `token`。
*   **成果**：解決了原生連結下載時的身份驗證問題。

### 第二步：簡化並強化標頭格式
*   在 `backend/api/projects.py` 中，使用 `FileResponse` 或自定義 `Response`。
*   強制設定 `media_type="application/octet-stream"`。
*   標頭使用最穩定的格式：`Content-Disposition: attachment; filename="{filename}"`。
*   **成果**：提高了瀏覽器對下載行為的識別率。

### 第三步：前端回歸「原生 <a> 標籤」方案
*   捨棄 `fetch` 與 `blob` 的複雜跳轉邏輯。
*   直接在 `FilePanel.jsx` 渲染帶有 `download` 屬性的原生 `<a>` 標籤。
*   **成果**：這是目前相容性最高、最不容易被瀏覽器插件攔截的下載方式。

## 4. 驗證結果 (Verification)
*   ✅ **檔名準確**：已成功產出如 `SpecForge_Project_3_英語學習系統.zip` 的檔名。
*   ✅ **中文相容**：ZIP 壓縮檔完整支援中文專案名稱。
*   ✅ **專案隔離**：檔案名稱後綴帶有正確的專案 ID。
*   ✅ **穩定性**：經多次跨瀏覽器測試（一般視窗與無痕視窗）均能穩定下載。

---
**存檔日期**：2026-05-10
**負責人員**：SpecForge AI Dev Team (Antigravity)
