# SpecForge AI — 資料庫設定與異步驅動指南

## 1. 核心設定 (Core Configuration)
在 SpecForge AI 的環境變數 (`.env`) 中，資料庫連線字串必須遵循以下格式：

```env
DATABASE_URL=sqlite+aiosqlite:///./data/specforge.db
```

## 2. 為什麼需要 `+aiosqlite`？

### A. 異步架構需求 (AsyncIO)
本系統後端使用 FastAPI 搭配 SQLAlchemy 的 `AsyncSession`。標準的 SQLite 驅動是同步的，會阻塞事件循環 (Event Loop)。`aiosqlite` 是專為 Python 異步設計的驅動程式，能確保在高併發環境下系統依然反應靈敏。

### B. 避免資料庫鎖定 (Preventing DB Locks)
SQLite 在多執行緒/多程序寫入時容易發生 `database is locked` 錯誤。透過 `aiosqlite` 配合 SQLAlchemy 的異步池管理，可以大幅降低 Agent 在同時產出檔案與寫入資料庫時發生的衝突。

## 3. 資料安全性與遷移 (Data Safety)

### A. 檔案一致性
`sqlite+aiosqlite://` 與 `sqlite://` 指向的是 **同一個實體檔案** (`.db`)。
*   **修改連線字串不會影響資料內容**。
*   您可以隨時在不同驅動間切換（只要程式碼支援），資料本身是安全且完整的。

### B. 常見問題排除 (Troubleshooting)
如果您發現資料庫無法連線，請檢查：
1.  `.env` 中是否漏寫了 `+aiosqlite`。
2.  Python 環境中是否安裝了 `aiosqlite` 套件（本專案已包含在依賴清單中）。
3.  `./data/` 目錄是否具備寫入權限。

---
**存檔日期**：2026-05-11
**負責人員**：SpecForge AI Dev Team
