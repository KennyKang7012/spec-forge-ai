# SpecForge AI — 階段性產出物管理與一鍵下載系統開發需求文件 (歸檔備存)

## 1. 功能範疇 (Feature Scope)
*   **個別檔案下載**：支援單獨下載各階段產出的 Markdown 檔案。
*   **一鍵打包 (ZIP)**：將專案所有相關文件即時壓縮並傳回。
*   **檔名規則**：`SpecForge_Project_{id}_{Name}.{ext}`。

## 2. 技術規格 (Technical Spec)
*   **後端路由**：
    *   `/api/projects/{id}/files/{filename}`
    *   `/api/projects/{id}/download-all`
*   **認證機制**：Header `Authorization` 或 Query `?token=`。
*   **前端實作**：原生 `<a>` 標籤按鈕化。

## 3. 測試要點 (Testing)
*   驗證下載後檔名是否正確。
*   驗證 ZIP 壓縮檔內檔案是否齊全。
*   驗證非授權用戶無法透過連結下載。
