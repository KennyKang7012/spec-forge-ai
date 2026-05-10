# OpenSpec 規格文件  
**專案代號**：WeeklyLog‑KB  
**文件版本**：v1.0 – 2026‑05‑10  
**負責人**：產品經理 (PM)  

> **目的**：將「每日工作日誌 + 研發知識庫」系統的商業需求、功能規格、非功能需求、技術架構與驗收標準，以 OpenSpec 標準整理為一份完整、可直接交付開發與驗證的規格文件。  

---  

## 1. 目錄  

| # | 標題 |
|---|------|
| 1 | 目錄 |
| 2 | 商業背景與問題聲明 |
| 3 | 商業目標與 KPI |
| 4 | 主要關係人 |
| 5 | 風險與緩解措施 |
| 6 | 功能範圍 (MVP) |
| 7 | 功能需求 (FR) |
| 8 | 非功能需求 (NFR) |
| 9 | 系統架構概觀 |
|10 | 資料模型 |
|11 | API 介面規格 |
|12 | 安全與授權 |
|13 | 部署、運維與 CI/CD |
|14 | 成功驗收標準 |
|15 | 實施路線圖 |
|16 | 任務拆解與工時預估 |
|17 | 變更管理與追蹤 |  

---  

## 2. 商業背景與問題聲明  

| 項目 | 說明 |
|------|------|
| **核心需求** | 為全體員工提供「每日工作日誌」平台，記錄文字、附件與工時，並自動將研發重要資訊匯入結構化知識庫。 |
| **痛點** | 1. 工作資訊與研發要點散落，缺乏可搜尋的沉澱；<br>2. 主管/高層無法即時掌握團隊進度與決策依據；<br>3. 專案透明度不足，導致進度、風險與品質難以最佳化。 |
| **驅動因素** | 透過資訊集中、即時回饋與知識沉澱，提升專案交付品質、加速新產品上市、提升員工參與度與營收共享。 |

---  

## 3. 商業目標與 KPI  

| 目標 | 描述 | KPI |
|------|------|-----|
| **提升專案交付品質與效率** | 減少資訊斷層與重工 | - 專案延期率 ↓ 20% <br> - 缺陷密度 ↓ 15% |
| **建立可重用的知識庫** | 研發重要事項自動歸納 | - 知識庫內容增長 ≥ 30 %/年 <br> - 搜尋命中率 ≥ 80 % |
| **增強營收貢獻** | 加速產品規劃與上市 | - 新產品上市週期縮短 10 % <br> - 營收增長率提升 5 % |
| **提升員工參與與激勵** | 透過分紅機制提升歸屬感 | - 員工滿意度 ↑ 0.5/5 <br> - 離職率 ↓ 10 % |

---  

## 4. 主要關係人  

| 角色 | 主要需求 | 期望參與程度 |
|------|----------|--------------|
| 員工 | 快速錄入、回顧日誌 | 高（每日使用） |
| 主管 / 老闆 | 即時檢視、討論、決策依據 | 中（每日或每週檢視） |
| 研發團隊 | 知識沉澱、問題追蹤、最佳實踐共享 | 中（重大決策後） |
| HR / 財務 | 薪酬、分紅依據、績效評估 | 低（報表需求） |
| 系統管理員 | 系統配置、權限、備份恢復 | 中（運維） |

---  

## 5. 風險與緩解措施  

| 風險 | 可能影響 | 緩解策略 |
|------|----------|----------|
| 使用者接受度低 | 系統不被日常使用，知識庫無法累積 | 內部培訓、使用指引、績效 KPI 連結 |
| 資料品質不佳（日誌缺失／內容不完整） | 知識庫價值下降 | 強制必填欄位、定期自動提醒與審核 |
| 安全漏洞 | 機密資訊外洩 | 定期安全掃描、最小權限原則、TLS 1.3 |
| 系統整合失敗（HR／專案系統） | 資料斷層、工時不一致 | 標準化 REST API、事前需求對接、測試環境 |
| 效能瓶頸（搜尋慢） | 使用者體驗下降 | ElasticSearch 集群、讀寫分離、Cache (Redis) |

---  

## 6. 功能範圍 (MVP)  

| 功能編號 | 功能描述 | 重要度 | 交付版次 |
|----------|----------|--------|----------|
| **F1** | 員工每日工作日誌錄入（文字、附件、工時） | 高 | MVP |
| **F2** | 自動週匯總生成（依部門、專案） | 高 | MVP |
| **F3** | 主管/老闆檢視、批註、討論工作日誌 | 高 | MVP |
| **F4** | 研發重要事項標籤與分類（技術決策、問題、解法） | 中 | MVP |
| **F7** | 通知機制（新日誌、主管回覆、知識庫更新） | 中 | MVP |
| **F9** | 權限管理（員工、主管、管理層、系統管理員） | 高 | MVP |

> 後續版次將陸續加入 **F5、F6、F8、F10** 等功能。

---  

## 7. 功能需求 (Functional Requirements, FR)  

> 每項需求皆以 **FR‑\<編號\>** 標識，內含 **描述、前置條件、後置條件、驗收標準**。  

| FR 編號 | 描述 | 前置條件 | 後置條件 | 重要度 |
|---------|------|----------|----------|--------|
| **FR‑F1‑01** | 員工可於 Web / 行動端建立「每日工作日誌」條目，欄位包括：日期、標題、工作描述、工時、附件、所屬專案/部門、標籤。 | 使用者已成功登入且具「員工」角色。 | 日誌寫入 MongoDB，附件流式上傳至檔案儲存 NAS。 | 高 |
| **FR‑F1‑02** | 系統自動驗證必填欄位與工時上限（每日 ≤ 24 小時）。 | 同上 | 若驗證失敗返回錯誤訊息；成功則返回 201 Created。 | 高 |
| **FR‑F2‑01** | 每週日凌晨 02:00（UTC+8）自動產生部門與專案的週匯總報表，格式支援 PDF 與 Excel 下載。 | 至少有 1 筆日誌於該週。 | 匯總報表寫入檔案儲存，並在 UI 中提供下載連結。 | 高 |
| **FR‑F3‑01** | 主管/老闆可檢視所屬部門/專案的所有日誌，支援關鍵字、日期、標籤篩選。 | 使用者具「主管」或「管理層」角色。 | 返回符合條件的日誌列表（分頁）。 | 高 |
| **FR‑F3‑02** | 主管可於日誌底部新增批註（文字、附件），並標記為「已審核」或「需追蹤」。 | 同上 | 批註寫入日誌子集合，觸發通知。 | 高 |
| **FR‑F4‑01** | 員工在錄入日誌時可選擇既有標籤或建立新標籤；標籤支援階層（例如：技術決策 > 架構），並自動映射至知識庫。 | 同 FR‑F1‑01 | 標籤資訊寫入 Tag 集合，同步至 ElasticSearch。 | 中 |
| **FR‑F7‑01** | 系統在以下事件發生時推送即時通知：① 新日誌建立、② 主管批註、③ 知識庫項目匯入。 | 使用者已於前端建立 WebSocket 連線或訂閱 SSE。 | 前端顯示 toast / 鈴聲提示。 | 中 |
| **FR‑F9‑01** | RBAC 授權機制：每個 API 請求在路由層驗證 JWT + 角色與資源屬性。 | 使用者已登入並持有有效 JWT。 | 若授權失敗返回 403 Forbidden。 | 高 |
| **FR‑F9‑02** | 系統管理員可於管理介面 CRUD 角色、指派使用者、設定權限矩陣。 | 管理員角色。 | 變更即時寫入 MongoDB，並記錄審計日志。 | 高 |

> 其餘功能（F5、F6、F8、F10）將於第 2 版與第 3 版分別實作，對應的 FR 編號將於後續迭代文件補充。

---  

## 8. 非功能需求 (Non‑Functional Requirements, NFR)  

| NFR 編號 | 項目 | 具體要求 | 驗證方法 |
|----------|------|-----------|----------|
| **NFR‑U‑01** | 可用性 | Web (Chrome/Edge) + 行動裝置 Responsive；錄入流程 ≤ 3 分鐘。 | 手動 UI 實測、流程計時 |
| **NFR‑P‑01** | 效能（前端） | 同時 200 使用者上線時，頁面載入 ≤ 2 秒。 | k6 負載測試 |
| **NFR‑P‑02** | 效能（搜尋） | 日誌 / 知識庫全文搜尋回應 ≤ 1 秒。 | k6 + ElasticSearch benchmark |
| **NFR‑S‑01** | 安全 – 傳輸層 | 全站使用 TLS 1.3，強制 HSTS。 | SSL Labs 測試 |
| **NFR‑S‑02** | 安全 – 身分驗證 | JWT 簽名 HS256 / RS256，過期 60 分鐘；支援 Token Refresh。 | 單元測試、滲透測試 |
| **NFR‑S‑03** | 安全 – 授權 | 基於 RBAC，最小權限原則。 | 授權測試、OWASP ZAP |
| **NFR‑S‑04** | 審計日誌 | 所有 CRUD、授權變更寫入 PostgreSQL，保留 7 天。 | 查詢審計表、Retention test |
| **NFR‑Sc‑01** | 可擴展性 | 微服務 + Kubernetes，支援水平擴展；ElasticSearch 可動態增加分片。 | HPA 壓力測試 |
| **NFR‑M‑01** | 維運性 | 藍綠部署零停機；備份 NAS 快照 7 天，可於 30 分鐘內恢復。 | 災難復原演練 |
| **NFR‑C‑01** | 合規 | 符合公司資訊安全政策與 GDPR（如適用），資料刪除符合「受眾請求」流程。 | 合規稽核清單 |
| **NFR‑R‑01** | 可靠性 | 系統全年可用率 ≥ 99.5%。 | SLO 監控、故障演練 |

---  

## 9. 系統架構概觀  

```mermaid
%%{init: {'theme':'neutral','flowchart':{'curve':'linear'}} }%%
flowchart LR
    subgraph Client["前端 (Web / Mobile)"]
        UI[React + TypeScript<br/>Responsive UI / PWA]
        Auth[JWT 登入<br/>OAuth2 Flow]
        Notify[WebSocket / SSE<br/>即時通知]
    end

    subgraph Gateway["API Gateway\n(Nginx + Express)"]
        GW[路由、TLS termination<br/>速率限制]
    end

    subgraph Services["後端微服務 (Docker / K8s)"]
        LogSrv[工作日誌服務<br/>CRUD + 附件上傳<br/>MongoDB]
        SumSrv[週匯總服務<br/>PDF/Excel產出<br/>CronJob]
        TagSrv[標籤/分類服務<br/>MongoDB]
        NotifSrv[通知服務<br/>Redis Pub/Sub + WS]
        SearchSrv[全文搜尋服務<br/>ElasticSearch + Sync Worker]
        KBSrv[知識庫匯入服務<br/>自動抽取 + ES Index]
        AuthSrv[本地 OAuth2 / JWT Issuer<br/>RBAC (Mongo)]
        AuditSrv[審計日志服務<br/>PostgreSQL]
    end

    subgraph Storage["持久化層"]
        Mongo[(MongoDB Cluster<br/>日誌、使用者、設定)]
        ES[(ElasticSearch Cluster<br/>全文索引、知識庫)]
        Redis[(Redis Cache<br/>Session、通知佇列)]
        PG[(PostgreSQL<br/>審計日志)]
        Files[(NAS / GlusterFS<br/>附件、報表，5 TB 永久保留)]
    end

    subgraph Ops["運維 / CI‑CD"]
        Git[GitHub Repo]
        GHAct[GitHub Actions<br/>單元、整合測試 → Docker Image]
        Registry[私有 Docker Registry]
        K8s[Kubernetes (on‑prem)<br/>Blue/Green Deploy, HPA]
        Monitoring[Prometheus + Grafana<br/>Health‑Check、SLO]
        Logging[EFK Stack<br/>系統日誌、搜尋]
    end

    UI --> GW
    GW --> AuthSrv
    GW --> LogSrv
    GW --> SumSrv
    GW --> TagSrv
    GW --> NotifSrv
    GW --> SearchSrv
    GW --> KBSrv
    GW --> AuditSrv

    AuthSrv --> Mongo
    LogSrv --> Mongo
    TagSrv --> Mongo
    SumSrv --> Mongo
    NotifSrv --> Redis
    SearchSrv --> ES
    KBSrv --> ES
    AuditSrv --> PG

    LogSrv --> Files
    SumSrv --> Files

    GHAct --> Registry
    Registry --> K8s
    Git --> GHAct

    Monitoring --> K8s
    Logging --> ES
```

### 架構說明  

| 層級 | 元件 | 角色 | 為何選擇 |
|------|------|------|-----------|
| 前端 | React + TypeScript | 員工、主管、管理員 UI | 元件化、企業 UI 標準相容、支援 PWA |
| API Gateway | Nginx + Express | 單入口、TLS termination、速率限制 | 簡化安全、集中路由 |
| 認證/授權 | 本地 OAuth2 + JWT + RBAC (Mongo) | 使用者登入、身分驗證、權限控管 | 符合「不使用外部 IdP」需求，易於客製化 |
| 工作日誌服務 | Express + MongoDB | 日誌 CRUD、附件流式上傳 | 文件型結構自然映射，彈性高 |
| 全文搜尋 | ElasticSearch + Sync Worker | 即時全文檢索、知識庫搜尋 | 滿足 ≤1 s 搜尋回應 |
| 知識庫匯入 | Node Worker + ES | 自動抽取標籤資訊、結構化索引 | 降低手動維護成本 |
| 通知服務 | Redis Pub/Sub + WebSocket | 即時通知推送 | 低延遲、水平擴展 |
| 審計服務 | PostgreSQL (append‑only) | 合規審計日誌 | 支援 GDPR、不可變更 |
| 檔案儲存 | NAS / GlusterFS (5 TB) | 日誌附件、報表永久保存 | 本地部署、成本可控 |
| 部署平台 | Kubernetes (on‑prem) | 微服務管理、藍綠部署、HPA | 彈性伸縮、零停機升級 |
| CI/CD | GitHub Actions → Docker Registry → Helm on K8s | 全自動測試、建置、部署 | 縮短交付週期、保證品質 |

---  

## 10. 資料模型  

> 以下僅列出核心集合（MongoDB）與 ElasticSearch 索引結構。  

### 10.1 MongoDB Collections  

| 集合 | 主要欄位 (type) | 說明 |
|------|-----------------|------|
| **users** | `_id: ObjectId`<br>`username: string`<br>`email: string`<br>`hashedPwd: string`<br>`role: enum[EMP, SUP, ADMIN]`<br>`profile: {fullName, dept, position}` | 使用者帳號與 RBAC 角色 |
| **logs** | `_id: ObjectId`<br>`authorId: ObjectId (ref users)`<br>`date: ISODate`<br>`title: string`<br>`description: string`<br>`hours: number`<br>`projectId: string`<br>`department: string`<br>`tags: [ObjectId]`<br>`attachments: [{fileId, fileName, mime, size}]`<br>`comments: [{authorId, text, createdAt, attachments}]`<br>`status: enum[SUBMITTED, APPROVED, REJECTED]` | 每日工作日誌主資料 |
| **tags** | `_id: ObjectId`<br>`name: string`<br>`parentId: ObjectId (optional)`<br>`category: enum[TECH_DECISION, ISSUE, SOLUTION, OTHER]` | 標籤與階層結構 |
| **projects** | `_id: ObjectId`<br>`code: string`<br>`name: string`<br>`department: string`<br>`ownerId: ObjectId` | 供日誌關聯的專案資訊 |
| **notifications** | `_id: ObjectId`<br>`userId: ObjectId`<br>`type: enum[NEW_LOG, COMMENT, KB_UPDATE]`<br>`payload: object`<br>`read: boolean`<br>`createdAt: ISODate` | 站內通知記錄 |
| **audit_logs** (PostgreSQL) | `id SERIAL`<br>`user_id UUID`<br>`action VARCHAR(50)`<br>`resource VARCHAR(100)`<br>`resource_id UUID`<br>`timestamp TIMESTAMP`<br>`detail JSONB` | 所有敏感操作的不可變紀錄 |

### 10.2 ElasticSearch Index  

| Index | 文件類型 | 主要欄位 |
|-------|----------|----------|
| `logs_idx` | 工作日誌 | `logId`, `authorName`, `date`, `title`, `description`, `tags`, `project`, `department` |
| `kb_idx`   | 知識庫條目 (由日誌抽取) | `kbId`, `sourceLogId`, `title`, `summary`, `tags`, `content`, `createdAt` |

> 同步 Worker 使用 MongoDB Change Streams，將新增 / 更新的 `logs` 轉換為 ES 文件，標記 `isKB = true` 時再寫入 `kb_idx`。

---  

## 11. API 介面規格  

> 本文件僅列出 MVP 主要的 REST API，完整 OpenAPI (v3) JSON/YAML 可於 GitHub 裡的 `openapi.yaml` 取得。  

| 方法 | 路徑 | 需求 | Request Body | Response | 授權 |
|------|------|------|---------------|----------|------|
| **POST** | `/api/v1/auth/login` | 使用者登入 | `{username, password}` | `{accessToken, refreshToken, expiresIn}` | ❌ |
| **POST** | `/api/v1/auth/refresh` | 取得新 access token | `{refreshToken}` | `{accessToken, expiresIn}` | ❌ |
| **GET** | `/api/v1/logs` | 取得目前使用者可見的日誌（支援 query） | - | `[{log}]` | ✅ (EMP/SUP/ADMIN) |
| **POST** | `/api/v1/logs` | 建立新日誌 | `LogCreateDTO` (必填欄位) | `201 Created {logId}` | ✅ (EMP) |
| **GET** | `/api/v1/logs/{id}` | 取得單筆日誌詳情 | - | `{log}` | ✅ (owner/SUP/ADMIN) |
| **PUT** | `/api/v1/logs/{id}` | 更新日誌（僅限作者在提交前） | `LogUpdateDTO` | `200 OK` | ✅ (owner) |
| **POST** | `/api/v1/logs/{id}/comments` | 新增批註 | `{text, attachments[]}` | `201 Created` | ✅ (SUP/ADMIN) |
| **GET** | `/api/v1/reports/weekly?dept=&project=&week=` | 產生週匯總 PDF/Excel | - | `binary (application/pdf|application/vnd.openxmlformats‑officedocument.spreadsheetml.sheet)` | ✅ (SUP/ADMIN) |
| **GET** | `/api/v1/tags` | 取得所有標籤 (階層) | - | `[Tag]` | ✅ (EMP/SUP/ADMIN) |
| **POST** | `/api/v1/tags` | 建立新標籤 | `{name, parentId?, category}` | `201 Created` | ✅ (ADMIN) |
| **GET** | `/api/v1/search` | 全文搜尋 (logs + kb) | `q=keyword&tags=&dateFrom=&dateTo=` | `{hits:[...], total}` | ✅ (EMP/SUP/ADMIN) |
| **GET** | `/api/v1/notifications` | 取得未讀通知 | - | `[Notification]` | ✅ (EMP/SUP/ADMIN) |
| **PATCH** | `/api/v1/notifications/{id}/read` | 標記為已讀 | - | `204 No Content` | ✅ (owner) |
| **GET** | `/api/v1/admin/roles` | 取得角色列表 | - | `[Role]` | ✅ (ADMIN) |
| **POST** | `/api/v1/admin/roles` | 新增 / 更新角色權限 | `RoleDTO` | `201 Created` | ✅ (ADMIN) |

> **錯誤回應**：所有 API 使用統一的錯誤結構 `{code, message, details?}`，HTTP 狀態碼遵循 REST Best Practices。  

---  

## 12. 安全與授權  

| 項目 | 實作方式 |
|------|----------|
| **傳輸安全** | Nginx 終端 TLS 1.3，強制 HSTS (max‑age 31536000)。 |
| **認證** | 本地 OAuth2 Authorization Code Flow + PKCE（SPA 用戶端），JWT 簽名使用 RSA‑256，`exp` 60 min，`iat`、`nbf` 皆檢查。 |
| **授權** | RBAC 角色表於 `users.role`；每個微服務在 Express 中使用 `authMiddleware` + `rbacMiddleware(resource, action)` 進行檢查。 |
| **密碼儲存** | bcrypt (cost 12) + pepper (環境變數)。 |
| **審計** | 所有 CRUD、授權變更寫入 PostgreSQL `audit_logs`，不可刪除；每日批次匯出供合規審查。 |
| **防護** | OWASP Top‑10 防禦：<br>• CSRF (SameSite=Lax + CSRF token)<br>• XSS (Content‑Security‑Policy, React 自動 escaping)<br>• SQL/NoSQL Injection (parameterised queries) |
| **資源隔離** | Kubernetes NetworkPolicies 限制 Pod 只允許必要的 ingress/egress；PodSecurityPolicy 禁止特權容器。 |
| **備份與災難復原** | MongoDB 2‑day Oplog +每日快照；NAS 每日增量快照保留 7 天；PostgreSQL PITR。 |

---  

## 13. 部署、運維與 CI/CD  

| 項目 | 方式 |
|------|------|
| **容器化** | 所有服務以 Dockerfile 建置，版本化標記 `weeklylog-kb/<service>:<git‑sha>`。 |
| **Kubernetes** | Helm chart `weeklylog-kb` 包含 Deployment、Service、Ingress、HPA、PodDisruptionBudget、NetworkPolicy。 |
| **藍綠部署** | Helm `--set deploymentStrategy=blueGreen`，使用 `service` 重新指向新版，舊版保留 10 分鐘回滾窗口。 |
| **CI/CD** | GitHub Actions：<br>1. Pull Request → 單元/整合測試<br>2. 合併至 `main` → Build Docker Image → 推至私有 Registry<br>3. 觸發 Helm 升級至測試環境 → 成功則自動推至正式環境。 |
| **Observability** | - **Prometheus** 收集指標 (CPU、Mem、HTTP latency、HTTP 5xx)<br>- **Grafana** Dashboard（系統概況、RPS、Error Rate、SLO）<br>- **EFK** (Elasticsearch + Fluentd + Kibana) 收集日誌，支援即時搜尋與 alert。 |
| **Alerting** | Alertmanager 依照 SLO 觸發 Slack / Email：<br>• Page latency > 2 s (5 min) <br>• 5xx 錯誤率 > 1 % |
| **備份** | - MongoDB 使用 `mongodump` + Daily incremental to NAS<br>- Elasticsearch snapshots (hourly) <br>- PostgreSQL `pg_dumpall` <br>- 所有備份加密傳輸、保存 30 天（符合 GDPR） |
| **容量規劃** | 初始：MongoDB 3 節點 2 vCPU/4 GB each，ES 3 節點 4 vCPU/8 GB each，NAS 5 TB。根據 KPI 監控自動調整 HPA。 |

---  

## 14. 成功驗收標準  

| 驗收項目 | 具體條件 |
|----------|----------|
| **功能完整性** | MVP 功能 F1‑F4、F7、F9 均可在測試環境完成 CRUD，且 UI 完整呈現。 |
| **效能** | 在 k6 200 同時使用者負載下：① 首頁載入 ≤ 2 s，② 搜尋請求回應 ≤ 1 s。 |
| **安全合規** | 透過 OWASP ZAP 測試無 High/Medium 漏洞；TLS 1.3、JWT 正確驗證、審計日誌完整。 |
| **使用者接受度** | 內部試點 2 個部門，80 % 員工每日完成日誌錄入，平均錄入時間 ≤ 3 min。 |
| **知識庫自動匯入** | 每週自動匯入 ≥ 95 % 標記為「研發重要事項」的日誌，且在 Kibana 可即時搜尋。 |
| **備份與恢復** | 於測試環境模擬災難，能在 30 分鐘內完成 MongoDB & NAS 完整回復。 |
| **部署零停機** | 藍綠部署切換期間，前端使用者請求成功率 ≥ 99.9 %。 |
| **監控與告警** | 所有關鍵指標 (CPU、Memory、Latency、ErrorRate) 均在 Grafana Dashboard 中可視化，Alertmanager 正常發送。 |

---  

## 15. 實施路線圖  

| 階段 | 時間 (週) | 里程碑 |
|------|-----------|--------|
| **探索 & 需求確認** | 0‑2 | 完成需求工作坊、原型驗證、最終功能清單凍結 |
| **MVP 開發** | 3‑8 | 完成 F1‑F4、F7、F9；單元/整合測試；CI/CD 建置 |
| **內部試點** | 9‑10 | 兩個部門（研發 + 行政）使用，收集 KPI 與回饋 |
| **知識庫 & 儀表板** | 11‑16 | 開發 F5、F6；ElasticSearch 整合；API 與 HR/專案系統對接 (F10) |
| **全公司部署** | 17‑20 | 全員培訓、藍綠部署上線、支援熱線 |
| **持續優化** | 21+ | 版本迭代 (第 2、3 版功能)、性能優化、跨部門擴展、多語系支援 |

---  

## 16. 任務拆解與工時預估  

| Epic | 主要任務 | 負責角色 | 預估工時 (人天) |
|------|----------|----------|-----------------|
| **E0 基礎建設** | Docker‑Compose 本地環境、Kind 測試叢集、CI/CD pipeline | DevOps | 5 |
| **E1 認證/授權** | User/Role schema、OAuth2 + JWT、密碼雜湊、忘記密碼流程、測試 | 後端 | 8 |
| **E2 日誌錄入** | 前端表單、文字編輯器、附件上傳、API CRUD、驗證、E2E 測試 | 前端/後端 | 12 |
| **E3 週匯總** | Batch Job、PDF/Excel 產出、CronJob、下載 UI、測試 | 後端 | 6 |
| **E4 主管檢視與討論** | 列表、篩選、批註 API、RBAC、即時通知、測試 | 前端/後端 | 10 |
| **E5 標籤與分類** | Tag selector、階層結構、後端 CRUD、同步至 ES、測試 | 前端/後端 | 6 |
| **E6 通知機制** | Redis Pub/Sub、WebSocket 客戶端、通知偏好 UI、測試 | 後端/前端 | 5 |
| **E7 權限管理** | RBAC schema、管理介面、授權 middleware、測試 | 後端 | 7 |
| **E8 全文搜尋** | 部署 ES、Change Streams 同步 Worker、搜尋 API、分面、測試 | 後端/DevOps | 9 |
| **E9 審計日志** | Middleware 審計、PostgreSQL schema、Retention、測試 | 後端 | 4 |
| **E10 性能與安全** | k6 負載測試、OWASP ZAP、TLS 檢查、測試報告 | QA/DevOps | 6 |
| **E11 部署與運維** | Helm chart、藍綠部署腳本、HPA、PodDisruptionBudget、監控 Dashboard、備份腳本 | DevOps | 7 |
| ******總計**** |  |  | **95 人天** (≈ 5–6 週的 5 人全職團隊) |

---  

## 17. 變更管理與追蹤  

* **變更請求**：所有需求/設計變更必須提交 JIRA Ticket，並由 PM、架構師、主要關係人共同審核。  
* **版本控制**：GitHub `main` 為穩定版，`dev` 為開發版；每次發佈以 `v<major>.<minor>.<patch>` 標記。  
* **文件同步**：OpenSpec markdown、OpenAPI spec、Helm chart、CI/CD pipeline 均保存在同一 repo，透過 GitHub Actions 自動生成 PDF 版規格。  

---  

### 完結語  

本 OpenSpec 規格文件彙總了 **商業背景 → 目標 KPI → MVP 功能 → 非功能需求 → 完整技術架構 → API 與資料模型 → 安全、部署、驗收** 等全部要素，已符合 OpenSpec 標準，可直接作為開發、測試與部署的基礎文件。  

如無其他補充，建議立即啟動 **Sprint 0**，完成基礎環境與 CI/CD 設定，進入 **MVP 開發** 階段。  

---  