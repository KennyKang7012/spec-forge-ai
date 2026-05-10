## 系統架構設計 (Local‑On‑Premise 部署)

以下方案完全符合 **40 位使用者**、**本地端自行管理基礎設施**、**無額外合規/安全** 的限制，並兼顧 **可擴展性**、**離線優先**、**安全傳輸** 與 **開發、維運成本** 可控。

### 1. 整體架構圖 (Mermaid)

```mermaid
graph LR
    subgraph Client[客戶端 (iOS / Android / Web)]
        A1[React Native App] 
        A2[React SPA (Web)]
        A1 -->|HTTP/HTTPS| B1[API Gateway]
        A2 -->|HTTP/HTTPS| B1
    end

    subgraph Edge[邊緣服務 (本地伺服器)]
        B1[API Gateway (NGINX + SSL)]
        B2[Auth Service (Keycloak)]
        B3[Sync Service (Supabase‑Like Realtime)]
        B4[Notification Service (FCM + SMTP)]
        B5[Task/Job Scheduler (Celery + Redis)]
        B6[File Storage (MinIO)]    
        B7[Database (PostgreSQL)]
        B8[Search Engine (ElasticSearch)]
        B9[Offline Cache (SQLite – 客戶端) ]
        B10[Backup Service (pgBackRest)]

        B1 --> B2
        B1 --> B3
        B1 --> B4
        B1 --> B5
        B1 --> B6
        B1 --> B7
        B1 --> B8

        B2 --> B7
        B3 --> B7
        B4 --> B7
        B5 --> B7
        B6 --> B7
        B8 --> B7
    end

    subgraph Infra[基礎設施]
        C1[Docker Compose / K8s (MiniKube) ]
        C2[負載平衡器 (HAProxy) ]
        C3[監控平台 (Prometheus + Grafana) ]
        C4[日誌平台 (EFK) ]
        C5[備援 (RAID 1) + 定時快照]
    end

    B1 --> C1
    B2 --> C1
    B3 --> C1
    B4 --> C1
    B5 --> C1
    B6 --> C1
    B7 --> C1
    B8 --> C1

    C1 --> C2
    C2 --> C3
    C2 --> C4
    C2 --> C5
```

#### 架構說明

| 元件 | 功能 | 為何選擇 |
|------|------|----------|
| **React Native** (iOS/Android) | 單一程式碼庫產出原生行動APP，支援 SQLite 本地離線儲存 | 輕量、跨平台、易於整合本地資料庫 |
| **React SPA** (Web) | 以 React + Vite 建置，使用 IndexedDB 作為離線緩存 | 與行動端保持 UI/UX 一致 |
| **NGINX (API Gateway)** | 反向代理、TLS termination、路徑路由、簡易流量控制 | 本地部署時成熟、低資源需求 |
| **Keycloak** (Auth) | OIDC / OAuth2 身份驗證、RBAC、密碼儲存加密 | 完全自管、支援多租戶與未來 SSO |
| **Sync Service** (Supabase‑like) | PostgreSQL + pg‑realtime (Postgres logical replication) + WebSocket | 實時雙向同步，避免額外 SaaS 依賴 |
| **Notification Service** | Firebase Cloud Messaging (FCM) + 本地 SMTP（如 Postfix） | 多渠道推播與 Email，確保提醒可靠 |
| **Celery + Redis** | 背景任務、提醒排程、週期性匯出、清理等 | 高度可擴展，簡易部署於 Docker |
| **MinIO** | S3 兼容物件儲存，用於附件、匯出檔案 | 本地化 S3，未來可接入雲端 |
| **PostgreSQL** | 主資料庫，支援 JSON、全文搜尋、行級安全 | ACID、支援大量查詢、易於備份 |
| **ElasticSearch** | 高階全文搜尋與過濾 (標籤、緊急等級、日期) | 提升搜尋效能、支援聚合分析 |
| **SQLite (客戶端)** | 離線寫入、即時 UI 回應 | 網路斷線時本地快取 |
| **Docker Compose / MiniKube** | 服務化部署、版本管理、快速擴容 | 免購併大型 K8s，適合小規模（40 人） |
| **HAProxy** | 負載平衡與健康檢查 (未來可水平擴展) | 簡易配置、支援 TCP/HTTP |
| **Prometheus + Grafana** | 系統指標 (CPU/Memory/Latency) 監控 | 99.5% 可用性保證 |
| **EFK** (Elasticsearch‑Fluentd‑Kibana) | 集中日誌、錯誤追蹤 | 滾動保存 30 天 |
| **pgBackRest** + **RAID 1** | 每日完整備份 + 雙磁碟冗餘 | 符合 NFR‑1 資料安全基本要求 |
| **TLS 1.3 + AES‑256** | Nginx SSL、PostgreSQL 加密連線、資料庫磁碟加密 | 符合基本傳輸與靜態資料保護 |

### 2. 非功能需求對應

| NFR | 實作方式 |
|-----|----------|
| **NFR‑1 安全性** | Nginx TLS 1.3、Keycloak OIDC、PostgreSQL SSL、資料磁碟加密 (LUKS) |
| **NFR‑2 可用性** | HAProxy + Docker‑restart‑policy、監控警報、雙節點 RAID 1 |
| **NFR‑3 響應時間** | 快取層 (Redis)、ElasticSearch 搜尋、前端本地 SQLite/IndexedDB |
| **NFR‑4 可擴展性** | 微服務化 (Auth、Sync、Notify)、Docker/K8s、Plug‑in API (REST + WebSocket) |
| **NFR‑5 跨平台一致性** | React 共用 UI 樣式庫 (MUI / Ant Design) |
| **NFR‑6 離線使用** | 客戶端 SQLite/IndexedDB + Sync Service 雙寫模型、衝突解決策略（最後寫入 + 手動合併） |

### 3. 開發任務拆解

以下任務以 **Sprint 2 週** 為單位，依功能模組、基礎設施、測試、部署劃分。每個任務可在 JIRA / GitHub Projects 中建立相應的 Issue，估算工時（人日）僅供參考。

| Sprint | 任務代號 | 任務名稱 | 內容說明 | 交付物 | 工時(人日) |
|--------|----------|----------|----------|--------|------------|
| **S1** | **INF‑001** | 基礎基礎設施腳本 | Docker‑Compose + HAProxy + TLS 設定腳本 | `docker-compose.yml`, `haproxy.cfg` | 2 |
| | **INF‑002** | 監控與日誌平台 | 部署 Prometheus + Grafana + EFK，建立儀表板 | Grafana dashboard, Logstash config | 2 |
| | **INF‑003** | 安全基礎建設 | LUKS 磁碟加密、PostgreSQL SSL、Nginx TLS 1.3 | SSL certs, pg_hba.conf | 1 |
| | **BK‑001** | 資料庫與備份 | PostgreSQL + pgBackRest + RAID1 設定 | DB schema, backup cron | 2 |
| **S2** | **AUTH‑001** | Keycloak 部署與初始設定 | Realm、Client、User‑Flow、角色 (User/Admin) | Keycloak config export | 2 |
| | **API‑001** | API Gateway (NGINX) 路由 | 定義 /api/v1/* 路徑，JWT 驗證 | Nginx config, CI test | 1 |
| | **SYNC‑001** | Realtime Sync Service | PostgreSQL logical replication + WebSocket server (Node.js) | ws‑sync service | 3 |
| **S3** | **FR‑001** | 多域筆記 CRUD API | Create/Read/Update/Delete，支援分類 (domain) | OpenAPI spec, unit tests | 3 |
| | **FR‑002** | 標籤系統 API | Tag CRUD、顏色屬性、筆記-標籤多對多關聯 | API, DB migration | 2 |
| | **FR‑003** | 緊急等級 API | 預設四級 + 自訂，筆記欄位 `urgency_level` | API, UI mock | 2 |
| | **FR‑004** | 里程碑與階段 API | Milestone、Stage、關聯日期/條件、完成回報 | API, DB migration | 3 |
| **S4** | **FR‑005** | 即時提醒服務 | Celery 任務排程 + FCM + SMTP (SendGrid 替代) | Notification workers, test email | 3 |
| | **FR‑006** | 基礎搜尋/過濾 API | ElasticSearch 索引、全文與多維度過濾 | ES mapping, API wrapper | 3 |
| | **FR‑007** | 成就儀表板 API | 里程碑完成統計、任務完成率、緊急任務統計 | API, DB view | 2 |
| **S5** | **CLIENT‑001** | React Native 客戶端基礎框架 | navigation, auth flow, SQLite 初始化 | App skeleton, CI pipeline | 3 |
| | **CLIENT‑002** | Web React SPA 框架 | Vite + React Router + IndexedDB | Web skeleton | 2 |
| **S6** | **CLIENT‑003** | UI 實作：多域筆記列表/編輯 | 標籤選擇、緊急等級、里程碑設定 UI | Screens, component library | 4 |
| | **CLIENT‑004** | UI 實作：成就儀表板 | 圖表 (Chart.js / Recharts)、過濾條件 | Dashboard page | 3 |
| **S7** | **OFFLINE‑001** | 離線寫入與衝突解決 | SQLite ↔ Sync Service 雙寫，衝突策略 | Sync adapter, unit tests | 4 |
| | **OFFLINE‑002** | 自動同步調度 | 網路恢復偵測、批次上傳 | Service worker, logs | 2 |
| **S8** | **TEST‑001** | 單元測試 (Jest / PyTest) | 所有 backend API 測試覆蓋 ≥80% | CI報告 | 3 |
| | **TEST‑002** | E2E 測試 (Cypress) | 主要使用者流程：新增筆記 → 標籤 → 緊急 → 提醒 → 完成 | Cypress scripts | 3 |
| **S9** | **DEPLOY‑001** | CI/CD Pipeline (GitHub Actions) | Build Docker images、推送至私有 Registry、滾動升級 | Workflow 文件 | 2 |
| | **DEPLOY‑002** | 災備演練腳本 | 模擬磁碟故障、備份還原、故障切換 | 演練手冊 | 2 |
| **S10** | **DOC‑001** | 使用者文件 & 上手教學 | Markdown + Demo video | Docs site | 2 |
| | **DOC‑002** | 開發者手冊 | API 规范、架構圖、部署指南 | Wiki pages | 2 |

> **總預估工時**：≈ 68 人日（約 3.5 個月全職開發者，符合 1‑3 個月 MVP 目標，剩餘功能可於後續沖刺完成）。

### 4. MVP 時程對照

| 時間 | 完成項目 | 核心交付 |
|------|----------|----------|
| **Month 1** (S1‑S3) | 基礎基礎設施、身份驗證、Realtime Sync、核心 CRUD API (筆記、標籤、緊急等級) | 服務可在本地環境完整啟動 |
| **Month 2** (S4‑S6) | 即時提醒、搜尋、成就儀表板 API + 客戶端基礎 UI (列表、編輯、儀表板) | 用戶可新增筆記、設定標籤/緊急度、收到提醒、查看儀表板 |
| **Month 3** (S7‑S9) | 離線寫入、衝突解決、完整測試、CI/CD 部署、備援演練 | 可靠的離線/同步體驗、持續部署、99.5% 可用性保證 |
| **後續迭代** (Month 4‑6) | 協作功能、AI 摘要、語音輸入、數據匯入/匯出 | 進一步提升黏著度與擴充性 |

### 5. 成本與維運概算（本地部署）

| 項目 | 每月成本（新台幣） | 說明 |
|------|------------------|------|
| 伺服器硬體 (2× Intel Xeon, 64GB RAM, 2TB RAID1 SSD) | ~ NT$30,000 | 包含電力、冷卻 |
| 網路頻寬（光纖 1Gbps） | ~ NT$5,000 | 內部企業網路 |
| 監控與備份軟體 (Prometheus, pgBackRest) | 免費（開源） | 人力維護成本已列入開發工時 |
| 其他（備份磁帶、UPS） | ~ NT$3,000 | 可選 |
| **合計** | **≈ NT$38,000** | 適合小型團隊自主管理 |

> 若未來使用者規模擴大，可將服務遷移至容器化的 MiniK8s 或商業私有雲，成本與可擴展性均可平滑提升。

---

## 結語

此架構在 **本地自行管理** 的前提下，提供了：

* **完整的跨平台（iOS、Android、Web）** 使用體驗  
* **離線優先 + 即時同步**，確保 40 位使用者在任何網路環境下均可操作  
* **即時提醒、里程碑與成就儀表板**，直接對應所有功能需求（FR‑1 ~ FR‑7）  
* **安全傳輸與資料加密**，滿足基礎合規需求（NFR‑1）  
* **可擴充的微服務/插件化** 設計，未來可輕鬆加入協作、AI、語音等功能  

配套的 **開發任務清單** 已按 Sprint 劃分，團隊可直接落實並在 3 個月內交付 MVP，後續根據路線圖逐步增添高階功能。祝開發順利、產品成功！