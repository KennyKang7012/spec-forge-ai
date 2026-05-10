# SpecForge AI — Phase 4：下載系統優化實錄 (歸檔)

## 1. 任務目標 (Objective)
解決 SpecForge AI 產出物在下載時發生的「檔名遺失」與「下載無反應」問題。確保所有產出物（Markdown 與 ZIP）在所有瀏覽器中均能以正確的檔名（包含專案 ID 與中文名稱）下載並保存。

## 2. 遇到的技術困難 (Challenges)
*   **檔名被 Chrome 識別為 UUID**：原本使用 JavaScript 的 `fetch` 取得數據後轉換為 `blob:` URL，這種方式會被部分瀏覽器攔截標頭。
*   **下載連結身份驗證 (Authorization)**：傳統的檔案下載連結無法透過 Header 傳送 Token。
*   **代理伺服器 (Vite Proxy) 干擾**：請求經過 Vite 代理轉發時，標頭有時會被修改。

## 3. 解決方案與實作 (Solutions)
*   **後端支援 Query Token 驗證**：支援從 URL 參數讀取 `token`。
*   **簡化並強化標頭格式**：使用 `FileResponse` 並強制設定 `media_type="application/octet-stream"`。
*   **前端回歸「原生 <a> 標籤」方案**：直接渲染帶有 `download` 屬性的原生連結，繞過 JS 攔截。

## 4. 驗證結果 (Verification)
*   ✅ 支援中文檔名。
*   ✅ 支援打包 ZIP 下載。
*   ✅ 已驗證跨瀏覽器相容性。
