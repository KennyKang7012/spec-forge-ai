## 📐 系統技術架構設計 (MVP)

```mermaid
%%{init: {'theme':'neutral','flowchart':{'curve':'linear'}} }%%
flowchart LR
    %% 用戶端
    subgraph Client["前端 (Web / Mobile)"]
        UI[React + TypeScript<br/>Responsive UI<br/>PWA 支援]
        Auth[JWT 身份驗證<br/>Local OAuth2 Server]
        Notify[WebSocket / Server‑Sent Events<br/>即時通知]
    end

    %% API Gateway
    subgraph Gateway["API Gateway\n(Nginx + Node/Express)"]
        GW[路由、速率限制、TLS termination]
    end

    %% 微服務
    subgraph Services["後端微服務 (Docker/K8s)"]
        LogService[工作日誌服務<br/>CRUD、附件上傳<br/>MongoDB]
        SummaryService[週匯總服務<br/>聚合、PDF/Excel 產出]
        TagService[標籤 & 分類服務<br/>Tag/Category DB (Mongo)]
        NotifyService[通知服務<br/>Redis Pub/Sub + WS 推送]
        SearchService[全文搜尋服務<br/>ElasticSearch + Sync Worker]
        KBService[知識庫匯入服務<br/>自動抽取標記資訊<br/>ElasticSearch Index]
        AuthService[本地 OAuth2 / JWT Issuer<br/>使用者/角色管理<br/>MongoDB]
        AuditService[審計日誌服務<br/>寫入 PostgreSQL (append‑only) ]
    end

    %% 資料儲存
    subgraph Storage["持久化層"]
        MongoDB[(MongoDB Cluster<br/>工作日誌、使用者、設定)]
        ES[(ElasticSearch Cluster<br/>全文索引、知識庫)]
        Redis[(Redis Cache<br/>Session、通知佇列)]
        PG[(PostgreSQL<br/>審計日誌)]
        Files[(檔案儲存 (NAS / GlusterFS)<br/>5 TB 永久保留<br/>支援分層快取)]
    end

    %% 系統管理與 CI/CD
    subgraph Ops["運維 / CI‑CD"]
        GitHub[GitHub Repository]
        GHActions[GitHub Actions<br/>單元/整合測試 → Docker Image]
        Registry[私有 Docker Registry]
        K8s[Kubernetes (on‑prem)<br/>Blue/Green Deploy, HPA]
        Monitoring[Prometheus + Grafana<br/>Health‑Check、SLO]
        Logging[EFK Stack (Elasticsearch‑Fluentd‑Kibana)<br/>系統日誌]
    end

    %% 連線
    UI --> GW
    GW --> AuthService
    GW --> LogService
    GW --> SummaryService
    GW --> TagService
    GW --> NotifyService
    GW --> SearchService
    GW --> KBService
    GW --> AuditService

    AuthService --> MongoDB
    LogService --> MongoDB
    TagService --> MongoDB
    SummaryService --> MongoDB
    NotifyService --> Redis
    SearchService --> ES
    KBService --> ES
    AuditService --> PG

    LogService --> Files
    SummaryService --> Files

    SearchService --> ES
    Monitor[Prometheus] --> K8s
    Logging --> ES

    GHActions --> Registry
    Registry --> K8s
    GitHub --> GHActions
```

### 架構說明

| 層級 | 元件 | 角色 | 主要理由 |
|------|------|------|----------|
| **前端** | React + TypeScript (CRA) | 員工、主管、管理員 UI | 元件化、易於部屬 PWA、支援桌面與行動裝置 |
| **API Gateway** | Nginx + Express | 單入口、TLS termination、速率限制、路由轉發 | 簡化微服務暴露、集中安全策略 |
| **認證/授權** | 本地 OAuth2 Server (Node) + JWT + RBAC (Mongo) | 使用者登入、角色權限驗證 | 符合「無外部 IdP」需求，支援最小權限原則 |
| **工作日誌服務** | Express + MongoDB | 日誌 CRUD、附件上傳（Stream to NAS) | 文件型資料自然映射、支援大容量附件 |
| **全文搜尋** | ElasticSearch + Sync Worker | 日誌與知識庫全文檢索、即時 ranking | 滿足搜尋 ≤1 s、支援未來語意搜尋 |
| **知識庫匯入服務** | Node worker + ES | 從日誌抓取標籤資訊、自動分類與匯入 | 知識沉澱自動化，降低手動維護成本 |
| **通知服務** | Redis Pub/Sub + WebSocket | 即時通知（新日誌、批註、KB 更新） | 低延遲、可水平擴展 |
| **審計服務** | PostgreSQL (append‑only) | 操作日誌、合規審計 | 符合 GDPR & 內部治理 |
| **檔案儲存** | NAS / GlusterFS (5 TB, 永久) | 日誌附件、匯出報表 | 本地部署、持久且成本可控 |
| **容器平台** | Kubernetes (on‑prem) | 微服務部署、藍綠發布、HPA | 微服務彈性、零停機升級 |
| **CI/CD** | GitHub Actions → 私有 Docker Registry → K8s | 全自動測試、建置、部署 | 縮短交付週期、保障品質 |
| **觀測** | Prometheus + Grafana、EFK | 健康檢測、性能指標、日誌追蹤 | 及時偵測瓶頸、符合 SLO 要求 |
| **安全** | TLS 1.3, JWT, RBAC, NetworkPolicies, PodSecurityPolicies | 加密、最小權限、網路隔離 | 防止未授權存取與資料外洩 |

---

## 🛠️ 開發任務拆解（MVP）

| Epic | User Story | 子任務 (Task) | 負責角色 | 預估工時 (人天) |
|------|------------|---------------|----------|-----------------|
| **E0 基礎建設** | 設置本地開發/測試環境 | - 建立 Docker‑Compose 本地環境<br>- 建立 K8s (kind) 測試叢集<br>- 撰寫 CI/CD pipeline (GitHub Actions) | DevOps | 5 |
| **E1 使用者/認證** | 員工登入系統 | - 設計 User、Role、Permission schema (Mongo)<br>- 實作本地 OAuth2 + JWT 發行<br>- 密碼雜湊、忘記密碼流程<br>- 單元/整合測試 | 後端 | 8 |
| **E2 日誌錄入** | 員工每日新增工作日誌 | - 前端 UI (表單, 文字編輯器, 附件上傳)<br>- 後端 API (CRUD) + Mongo schema<br>- 附件流式上傳至 NAS<br>- 必填欄位校驗、工時驗證<br>- 單元/E2E 測試 | 前端/後端 | 12 |
| **E3 週匯總** | 系統自動產生部門／專案週報 | - 後端 Batch/Job (Node) 每週聚合日誌<br>- 產出 PDF & Excel（jsPDF, exceljs）<br>- UI 下載入口<br>- 任務排程 (Kubernetes CronJob) | 後端 | 6 |
| **E4 主管檢視與討論** | 主管觀看日誌、批註、回覆 | - 前端列表、篩選、搜尋 UI<br>- API: 取得日誌、POST 批註<br>- RBAC: 僅主管/管理層可批註<br>- 即時通知觸發 (NotifyService) | 前端/後端 | 10 |
| **E5 標籤與分類** | 員工為日誌加上研發重要標籤 | - 前端 Tag selector (autocomplete)<br>- 後端 Tag CRUD + 與日誌關聯<br>- 標籤層級/階層結構設計<br>- UI 依標籤篩選 | 前端/後端 | 6 |
| **E6 通知機制** | 新日誌、批註、KB 更新即時通知 | - 建立 Redis Pub/Sub channel<br>- 後端 NotifyService 發布事件<br>- 前端 WebSocket 客戶端接收與 UI toast<br>- 設定通知偏好 (Email 可延伸) | 後端/前端 | 5 |
| **E7 權限管理** | 設計角色與權限矩陣 | - RBAC schema (Mongo)<br>- 管理介面：建立/編輯角色、指派使用者<br>- 中介層授權檢查 (Express middleware)<br>- 單元測試 | 後端 | 7 |
| **E8 全文搜尋** | 日誌與知識庫快速搜尋 | - 部署 ElasticSearch (單節點於測試環境)<br>- 同步 Worker: Mongo → ES (Change Streams)<br>- 前端搜尋框 + 呼叫 Search API<br>- 排序、分面 (by tag, date, author) | 後端/DevOps | 9 |
| **E9 審計日志** | 紀錄所有敏感操作 | - 設計 Audit schema (PostgreSQL)<br>- Middleware: 记录 API 呼叫、使用者、時間、變更內容<br>- Log rotation & retention (7 天) | 後端 | 4 |
| **E10 基礎測試 & 安全** | 確保系統符合非功能需求 | - 負載測試 (k6) 200 並發 <br>- 安全掃描 (OWASP ZAP) <br>- TLS 1.3 檢查 <br>- 編寫測試報告 | QA/DevOps | 6 |
| **E11 部署與運維** | 藍綠部署、監控、備份 | - K8s 部署檔 (Helm chart) <br>- 配置 HPA、PodDisruptionBudget <br>- 設定 Prometheus + Grafana Dashboard <br>- NAS 定期快照 (7 天) | DevOps | 7 |

**MVP 總估算**： 約 **95 人天**（約 5–6 週的全職 5 人團隊開發速度），可在 **8 週** 內完成開發、內部測試與試點部署。

---

## 📊 非功能驗收指標（對應需求）

| 非功能需求 | 檢測方法 | 合格標準 |
|-----------|----------|----------|
| **可用性** | 手機/桌面 UI 測試、錄入流程計時 | 錄入 ≤ 3 分鐘，介面 Responsive |
| **效能** | k6 併發測試 (200 同時使用者) | 首頁載入 ≤ 2 s、搜尋 ≤ 1 s |
| **安全** | OWASP ZAP、TLS 1.3 抓包測試、JWT 簽名驗證 | 無高危漏洞、全站 TLS 1.3、JWT 60 分鐘過期 |
| **可擴展性** | Kubernetes HPA 壓力測試、ElasticSearch 分片增加 | CPU 使用率 ≤ 70% 時自動擴容 |
| **維運性** | 藍綠部署演練、備份/還原測試 | 零停機升級、備份成功且可於 30 分鐘內恢復 |
| **合規** | GDPR Data‑Mapping、審計日誌完整度檢查 | 所有個資操作都有審計記錄，符合 GDPR 內部流程 |

---

## 🚀 下一步行動建議

1. **需求凍結 & 角色簽核**：讓所有關係人確認功能範圍與非功能目標。  
2. **建立專案倉庫 & CI/CD**：依上述 pipeline 建立 GitHub Repo、Docker Registry。  
3. **Sprint 0（1 週）**：環境建置、K8s 叢集與 ElasticSearch 初版，完成基礎骨架。  
4. **Sprint 1‑4（每兩週一次）**：依 Epics 迭代開發，持續交付可測試的功能。  
5. **內部試點（第 9‑10 週）**：兩個部門上線，收集使用回饋與 KPI 數據。  
6. **評估與調整**：根據使用者接受度與性能數據決定第 11‑16 週的知識庫與儀表板開發優先次序。  

---

### 總結

- **技術選型** 完全符合 **本地部署**、**不需外部 IdP**、**5 TB 永久檔案** 的限制。  
- **微服務 + Kubernetes** 為未來擴充（多語系、跨部門）提供彈性。  
- **ElasticSearch** 解決搜尋與知識庫的即時性與效能。  
- **完整任務拆解** 讓開發、測試、運維角色都有明確工作範圍，確保 8 週內交付 MVP。  

如無其他需求，建議即刻進入 **Sprint 0**，開始實作與部署。祝開發順利 🚀