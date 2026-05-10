# OpenSpec Specification  
**Project Name**: 小學二年級英語單詞學習系統  
**Project Code**: Project 3  
**Document Version**: v1.0  
**Author**: 技術寫手 (Technical Writer)  
**Date**: 2026‑05‑10  

---  

## 1. Overview  

| 項目 | 內容 |
|------|------|
| **系統名稱** | 小學二年級英語單詞學習系統 |
| **目標** | 以遊戲化、即時聲音回饋與獎勵機制提升 7–8 歲二年級學生學習英語單詞的動機、興趣與記憶成效。 |
| **核心價值** | 差異化教育產品、符合市場對互動學習工具的需求、為未來付費擴充（進階關卡、教師版報表）奠定平台基礎。 |
| **主要受益者** | 小學二年級學生、家長、教師、產品經理/投資方、開發團隊 |
| **預期上線環境** | 本地資料中心（台灣） – 符合本地資安法規與資料留存要求。 |
| **支援平台** | Web (PC/Tablet) – Chrome / Safari / Edge；iOS 12+、Android 8+（PWA 方式）。 |

---

## 2. Business Objectives & Success Metrics  

| KPI | 目標值 | 衡量方式 |
|-----|--------|----------|
| **每日使用時長** | ≥ 15 分鐘/生 | 後台使用紀錄 |
| **單詞掌握率** | 正確率 ≥ 85 %（測驗） | 系統測驗結果 |
| **活躍用戶** | 1‑月活躍率 ≥ 70 % | 註冊帳號日活/月活比 |
| **家長/教師 NPS** | ≥ 30 | 上線後第一季問卷 |
| **30 天留存率** | ≥ 50 % | 用戶留存曲線 |
| **獎勵兌換率** | 積分使用率 ≥ 60 % | 後台兌換紀錄 |
| **音效回饋延遲** | 點擊 → 音效 ≤ 200 ms | 前端性能測試 |
| **系統可用率** | ≥ 99.5 %（7 天） | 監控報表 |

---

## 3. Stakeholders  

| 角色 | 需求/期望 | 主要關注點 |
|------|----------|------------|
| **二年級學生** | 好玩、即時回饋、可收集小物 | 流暢度、動畫與聲音品質 |
| **家長** | 學習成效、隱私安全、無廣告 | 成績報告、最小化個資、家長同意流程 |
| **教師** | 補充課堂、掌握班級學習狀況 | 數據分析、關卡管理、報表匯出 |
| **產品經理／投資方** | 市場差異化、商業化、成本控制 | 產品路線圖、付費擴充可能性 |
| **開發團隊** | 明確需求、可重用元件、技術可行 | 技術選型、開發時程、測試覆蓋率 |
| **法務/合規** | 符合 COPPA、GDPR‑Kids、在地兒童保護法 | 最小化資料、家長同意、審計日誌 |

---

## 4. Scope  

### 4.1 Minimum Viable Product (MVP)  

| 功能 | 說明 |
|------|------|
| **單詞卡與發音** | 約 30 個二年級常見單詞，文字 + 圖示，點擊播放正確發音。 |
| **點擊配對遊戲** | 文字 ↔ 圖像配對，成功顯示動畫與音效，回合計時。 |
| **積分與小物獎勵** | 配對成功即得積分，可兌換「小物」貼紙，背包 UI 內展示。 |
| **學習進度紀錄** | 記錄已學、未學單詞、正確率與總積分；提供家長/教師儀表板。 |
| **後台管理** | 單詞、圖片、音檔 CRUD；關卡設定；積分/小物規則配置。 |

> **排除於 MVP**：排行榜、成就徽章、跨平台同步、付費功能、完整多語系支援。  

### 4.2 後續可擴充功能  

| 功能 | 目的 |
|------|------|
| 排行榜 & 成就徽章 | 社交動機提升 |
| 多語系支援 (西班牙文、日文) | 海外市場拓展 |
| 雲端高可用架構 | 災難復原、彈性擴容 |
| 付費進階關卡與金流 | 商業化收入來源 |
| 離線模式 (PWA) | 校園網路不穩定時仍可學習 |

---

## 5. Functional Requirements  

### 5.1 前端（React + TypeScript）  

| 功能 | 子項目 | UX / 交互要點 |
|------|--------|---------------|
| 單詞卡片 | 圖示、文字、發音按鈕 | 色彩鮮明、按鈕尺寸符合 7‑8 歲手指操作，發音延遲 ≤ 150 ms |
| 配對遊戲 | 隨機排列卡片、點擊配對、成功動畫、錯誤音效 | 即時回饋，動畫 ≤ 800 ms，避免卡頓 |
| 積分 & 小物 | 積分條、兌換按鈕、背包視圖 | 直觀圖示，音效提示「兌換成功」 |
| 進度儀表板 | 圓形掌握率、積分折線圖 | 家長模式切換、隱藏遊戲 UI |
| 登入／註冊 | 家長同意、匿名學生 ID | 最小化資料、JWT 受保護 |
| 後台管理介面 | 單詞 CRUD、關卡編輯、規則設定 | 表單即時驗證、CSV/圖檔預覽 |
| 可訪問性 | 文字替代說明、音量控制、低對比模式 | 符合 WCAG AA 標準 |

### 5.2 後端（Node.js + Express + TypeScript）  

| API | 方法 | 功能說明 | 安全/隱私 |
|-----|------|----------|-----------|
| `/api/auth/login` | POST | 家長/教師登入，返回 JWT + Refresh Token | 密碼雜湊、速率限制 |
| `/api/auth/register` | POST | 家長註冊，必須附家長同意表單 | 最小化個資、加密儲存 |
| `/api/words` | GET | 取得單詞清單、圖示、發音 URL | 只讀，無個資 |
| `/api/game/result` | POST | 上傳單輪配對結果（正確/錯誤、取得積分） | JWT 保護 |
| `/api/progress` | GET/POST | 讀寫學生單詞掌握率、總積分 | 加密儲存、最小化資料 |
| `/api/rewards` | POST | 兌換小物，扣除積分 | 授權檢查 |
| `/admin/words` | CRUD | 後台單詞與資源管理（圖片/音檔） | RBAC，僅管理員 |
| `/admin/levels` | CRUD | 關卡設定（配對題組） | RBAC |
| `/admin/rewards` | CRUD | 積分與小物兌換規則 | RBAC |
| `/admin/users` | CRUD | 家長/教師帳號與權限管理 | RBAC、審計日誌 |

### 5.3 非功能需求  

| 項目 | 需求 | 測量方式 |
|------|------|-----------|
| **使用者體驗** | UI 色彩鮮明、操作簡潔、字體大小適合 7‑8 歲 | 用戶測試 – 目標 90% 正向回饋 |
| **互動延遲** | 點擊 → 音效 ≤ 200 ms，動畫啟動 ≤ 150 ms | 前端性能測試（Lighthouse、自動化腳本） |
| **可擴充性** | 後台 5 分鐘內可批量上傳 100+ 單詞 | 後台測試 |
| **可維護性** | 前端採 component‑based + TypeScript；後端分層架構 | 代碼審查、CI 靜態分析 |
| **兼容性** | Chrome 80+, Safari 13+, Edge 最新版；iOS 12+, Android 8+ | 跨平台測試 |
| **安全與隱私** | 無個人身份資訊；若有帳號則最小化資料、家長同意、加密儲存 | 合規審查、PenTest |
| **可訪問性** | 提供文字替代說明、音量控制、低對比模式 | WCAG AA 測試 |
| **可靠性** | 系統可用率 ≥ 99.5%（7 天） | 監控告警、SLA 報表 |
| **性能** | 同時 20 個使用者併發，API 平均回應 ≤ 150 ms | 壓力測試（k6 / JMeter） |

---

## 6. System Architecture  

```mermaid
graph TD
    %% 用戶端
    subgraph 用戶端
        U1[學生 (Web / Mobile)]
        U2[家長/教師管理介面]
    end

    %% 前端
    subgraph 前端 (React + TypeScript)
        FE[SPA 主程式]
        FE --> UI1[單詞卡片 UI]
        FE --> UI2[配對遊戲 (PixiJS/Canvas)]
        FE --> UI3[積分 & 小物 UI]
        FE --> UI4[學習儀表板]
        FE --> UI5[登入/註冊頁面]
    end

    %% API Gateway
    subgraph API 層 (Node.js/Express + TypeScript)
        GW[RESTful API Gateway]
        GW --> Auth[認證服務 (JWT + OAuth2)]
        GW --> SrvWord[單詞服務]
        GW --> SrvGame[遊戲結果服務]
        GW --> SrvProg[進度/積分服務]
        GW --> SrvAdmin[後台管理服務]
    end

    %% 資料層
    subgraph 資料層
        DB[PostgreSQL]
        Cache[Redis (Session / Cache)]
        Store[檔案儲存 (NAS / 本地 Object Store)]
    end

    %% 後台管理介面
    subgraph 後台 (React Admin)
        AdminUI[單詞/關卡 CRUD]
        AdminUI --> SrvAdmin
    end

    %% 監控與分析
    subgraph 監控/分析
        Mon[Prometheus + Grafana]
        Log[ELK (Logstash + Kibana)]
        KPI[自建 KPI Dashboard]
    end

    %% 流程
    U1 & U2 --> UI5
    UI5 --> Auth
    Auth --> GW
    GW --> SrvWord
    GW --> SrvGame
    GW --> SrvProg
    GW --> SrvAdmin
    SrvWord --> Store
    SrvGame --> Store
    SrvProg --> DB
    SrvAdmin --> DB
    SrvAdmin --> Store
    UI1 -->|載入圖片/音檔| Store
    UI2 -->|載入音檔/動畫| Store
    UI3 -->|即時積分| Cache
    UI4 -->|查詢進度| DB
    AdminUI --> SrvAdmin
    GW --> Cache
    GW --> Mon
    GW --> Log
    Mon --> KPI
    Log --> KPI
```

### 6.1 主要元件說明  

| 元件 | 技術 | 目的 |
|------|------|------|
| **SPA (React + TS)** | React, React‑Router, Styled‑Components, i18n (中/英) | 學生與家長/教師共用 UI，支援響應式 |
| **PixiJS / Canvas** | PixiJS、Web Audio API、preload.js | 點擊配對、動畫與即時音效 |
| **API Gateway** | Express, cors, helmet, rate‑limit | 統一入口、路由、錯誤處理、速率限制 |
| **認證服務** | jsonwebtoken, oauth2orize, bcrypt | JWT + 簡易 OAuth2，家長同意流程 |
| **業務服務層** | Service‑layer pattern, TypeORM | 單詞、遊戲結果、進度、獎勵 |
| **PostgreSQL** | pgSQL, Sequelize / TypeORM | 結構化資料（單詞、使用者、關卡、積分） |
| **Redis** | redis | Session、短期積分快取 |
| **檔案儲存** | 本地 NAS / MinIO (S3‑compatible) | 圖片、音檔、匯出報表 |
| **監控** | Prometheus, Grafana, ELK | 系統健康、API 延遲、日誌審計 |
| **CI/CD** | GitHub Actions, Docker, Docker‑Compose (或 K8s) | 自動化建置、測試、部署 |
| **安全** | TLS 1.2+, AES‑256 靜態加密, OWASP 防護 | 資料傳輸與儲存安全，符合 COPPA/GDPR‑Kids |

---

## 7. API Specification (selected endpoints)  

> 所有受保護的 API 皆需在 `Authorization: Bearer <JWT>` 標頭中傳遞有效 token。  

| 方法 | 路徑 | 說明 | 請求 Body (JSON) | 回應範例 |
|------|------|------|-------------------|----------|
| **POST** | `/api/auth/register` | 家長註冊（必須勾選同意） | `{ "email": "parent@example.com", "password": "P@ssw0rd", "consent": true }` | `201 Created` `{ "userId": "u123", "token": "...", "refreshToken": "..." }` |
| **POST** | `/api/auth/login` | 登入取得 JWT | `{ "email":"parent@example.com","password":"P@ssw0rd" }` | `200 OK` `{ "token":"...", "refreshToken":"..." }` |
| **GET** | `/api/words` | 取得單詞清單（公開） | – | `200 OK` `{ "words": [{ "id":"w01","text":"Apple","imageUrl":"/img/apple.png","audioUrl":"/audio/apple.mp3" }, …] }` |
| **POST** | `/api/game/result` | 上傳單輪結果，計算積分 | `{ "userId":"s001","levelId":"l01","answers":[{"wordId":"w01","correct":true},…] }` | `200 OK` `{ "pointsEarned": 15, "newTotal": 120 }` |
| **GET** | `/api/progress/{userId}` | 讀取學習進度 | – | `200 OK` `{ "userId":"s001","completed":12,"total":30,"accuracy":0.86,"points":120 }` |
| **POST** | `/api/rewards/redeem` | 兌換小物 | `{ "userId":"s001","rewardId":"sticker01","cost":30 }` | `200 OK` `{ "success":true,"remainingPoints":90,"inventory":["sticker01"] }` |
| **POST** | `/admin/words` | 新增單詞（管理員） | `{ "text":"Banana","imageFile":<binary>,"audioFile":<binary> }` | `201 Created` `{ "id":"w45","status":"saved" }` |
| **PUT** | `/admin/levels/{levelId}` | 更新關卡設定 | `{ "name":"Level 1","pairs":[{"wordId":"w01","imageId":"i01"},…] }` | `200 OK` `{ "levelId":"l01","status":"updated" }` |
| **GET** | `/admin/reports/kpi` | 取得 KPI 報表（CSV） | – | `200 OK` (CSV file) |

> **註**：完整的 OpenAPI 3.0 YAML/JSON 於附件 `openapi-spec.yaml`（不列於本文）供自動化測試與文件生成使用。

---

## 8. Data Model (Logical)  

| Table / Collection | 主鍵 | 主要欄位 | 說明 |
|--------------------|------|----------|------|
| `users` | `id` (UUID) | `email`, `passwordHash`, `role` (parent/teacher/admin), `consentGiven`, `createdAt` | 家長或教師帳號，匿名學生僅以 `studentId` 產生，不儲存個資 |
| `students` | `id` (UUID) | `parentId` (FK), `displayName`, `createdAt` | 每位學童的唯一識別，僅保存最小資訊 |
| `words` | `id` (UUID) | `text`, `imageUrl`, `audioUrl`, `gradeLevel`, `createdAt` | 單詞資料庫 |
| `levels` | `id` (UUID) | `name`, `gradeLevel`, `pairs` (JSON array), `order` | 配對題組設定 |
| `game_results` | `id` (UUID) | `studentId`, `levelId`, `answers` (JSON), `pointsEarned`, `timestamp` | 每輪遊戲結果 |
| `progress` | `id` (UUID) | `studentId`, `wordId`, `status` (learned / learning), `correctCount`, `attemptCount` | 單詞掌握狀態 |
| `rewards` | `id` (UUID) | `name`, `type` (sticker / badge), `cost`, `imageUrl` | 獎勵物件 |
| `inventory` | `id` (UUID) | `studentId`, `rewardId`, `acquiredAt` | 學生已兌換的小物 |
| `audit_logs` | `id` (UUID) | `userId`, `action`, `entity`, `entityId`, `timestamp`, `details` | 合規審計用日誌 |

> 所有文字資料皆使用 UTF‑8 編碼，時間戳記統一為 UTC。

---

## 9. Security & Privacy  

| 項目 | 控制措施 |
|------|----------|
| **認證** | JWT (access token 1 h) + Refresh token (7 d)；密碼使用 bcrypt 12+ round 雜湊 |
| **授權** | RBAC：`admin`、`teacher`、`parent`、`student` 四種角色；API 依角色檢查權限 |
| **最小化資料** | 學生僅儲存 `studentId`、`displayName`（可選），無生日、地址等個資 |
| **家長同意** | 註冊時必須勾選「同意兒童資料處理」；同意紀錄存於 `users.consentGiven` 與 `audit_logs` |
| **傳輸加密** | 全站使用 TLS 1.2+，強制 HTTPS；內部服務間亦使用 TLS |
| **靜態資料加密** | 敏感欄位（如 email）使用 AES‑256 加密存儲 |
| **日誌與審計** | 所有登入、資料變更操作寫入 ELK，保留 180 天 |
| **隱私合規** | 符合 COPPA、GDPR‑Kids、台灣兒童線上保護規範；提供資料刪除請求 API `/api/users/{id}`（僅限家長） |
| **防護機制** | OWASP Top 10 防護：SQLi 防護、XSS/CSRF Token、Content‑Security‑Policy、Rate‑limit (100 req/min/IP) |
| **備份與災難復原** | PostgreSQL 每日全備 + 每小時增量；檔案儲存每日快照；備份保留 30 天，可於本地資料中心快速還原 |

---

## 10. Deployment & Operations  

| 階段 | 活動 | 工具 / 設定 |
|------|------|------------|
| **基礎設施** | 伺服器 (2×API, 2×DB) + 內部 LAN 防火牆 | Ansible + Terraform（本地 VM） |
| **容器化** | 前端、後端、後台、代理服務 Docker 化 | Docker‑Compose (開發) / Kubernetes (生產) |
| **CI/CD** | 代碼推送 → 單元測試 → Docker 映像 → 部署至 staging → 手動批准 → prod | GitHub Actions, SonarCloud, Harbor (私有 registry) |
| **監控** | CPU、Memory、API latency、error rate、log aggregation | Prometheus + Grafana, ELK, Alertmanager (email/SMS) |
| **備份** | PostgreSQL logical backup + WAL‑archiving；NAS 快照 | pgBackRest, rsync, cron |
| **災難復原演練** | 每月一次全備份還原測試 | 紀錄 SOP、演練報告 |
| **日常運維** | 版本升級、安裝安全補丁、容量規劃 | 週次會議、Jira 票務 |
| **可訪問性測試** | WCAG AA 檢測、螢幕閱讀器測試 | axe‑core, Chrome DevTools |

---

## 11. Development Plan & Milestones  

| 週次 | 里程碑 | 交付物 |
|------|--------|--------|
| 1‑2 | **需求確認 & 基礎設施建置** | 需求確認書、CI/CD、監控基礎、Docker 基礎映像 |
| 3‑4 | **前端框架 & 認證服務** | React + TS 專案腳手架、登入/註冊 UI、JWT 認證 API |
| 5‑6 | **單詞卡片 & 單詞 API** | 單詞 UI、`/api/words`、音效預載與快取 |
| 7‑8 | **配對遊戲核心 & 遊戲結果 API** | PixiJS 配對遊戲、`/api/game/result`、積分計算 |
| 9‑10 | **積分/小物 UI & 相關服務** | 積分條、兌換 UI、`/api/rewards`、Redis 快取 |
| 11‑12 | **後台管理介面** | React‑Admin CRUD、CSV 匯入、關卡設定、規則編輯 |
| 13‑14 | **測試與驗證** | 功能、性能、可訪問性、安防測試、合規審查 |
| 15 | **部署到本地資料中心** | Docker‑Compose / K8s 產線、監控告警設定 |
| 16 | **Beta 內部測試 & KPI Dashboard 初版** | 內部使用者測試回饋、KPI Dashboard (Grafana) |
| 17‑18 | **最後優化 & 正式上線** | Bug 修正、文件交付、上線公告 |

> **總工時估算**：138 人日（約 28 週），以 2‑3 位全職開發者可在 3 個月內完成 MVP。  

---

## 12. Risk Management  

| 風險 | 潛在影響 | 緩解措施 |
|------|----------|----------|
| 內容審核延遲（單詞、圖示版權） | MVP 交付延期 | 事前簽署圖示與音檔授權協議，使用開源或自行製作資源；提供 CSV 匯入快速上線 |
| 隱私合規未達標 | 法規風險、上線阻礙 | 早期與法務顧問審核流程，最小化資料、家長同意機制、加密儲存 |
| 音效或動畫延遲 > 200 ms | 兒童體驗下降 | 前端採用音效預載、CDN 加速；性能測試納入 CI |
| 跨平台相容性問題 | 部分設備卡頓或無法使用 | 早期在 iOS/Android 真機與不同瀏覽器測試，必要時降級動畫帧率 |
| 開發人力波動 | 里程碑延誤 | 採用敏捷 Scrum，雙週回顧與資源彈性調整，確保關鍵路徑有人力 |
| 安全漏洞或資料外洩 | 法規罰款、品牌受損 | 定期 PenTest、依 OWASP 12‑point 實作、即時安全更新 |

---

## 13. Acceptance Criteria  

| 項目 | 驗收條件 |
|------|----------|
| **功能完整性** | MVP 所列 5 大功能全部實作，無「Severity ≥ 3」缺陷。 |
| **性能** | 95% 交互點擊 → 音效 ≤ 200 ms，API 平均回應 ≤ 150 ms，70% 以上測試通過。 |
| **可用性測試** | 7‑8 歲兒童測試 NPS ≥ 30，家長滿意度 NPS ≥ 30。 |
| **安全合規** | COPPA / GDPR‑Kids 合規審查通過，所有日誌都有審計記錄。 |
| **部署** | 生產環境具備自動化 CI/CD，監控告警閥值設定完成，系統可用率 ≥ 99.5%。 |
| **文檔** | 完整 OpenSpec (本文件) + OpenAPI 3.0 YAML、部署 SOP、測試腳本、使用者手冊均已交付。 |
| **KPI 初始達成** | Beta 30 天內平均每日使用時長 ≥ 10 分鐘，單詞掌握率 ≥ 70%。 |
| **備份/恢復** | 全備份可於 30 分鐘內完成還原測試。 |

---

## 14. Appendices  

### 14.1 Glossary  

| 項目 | 說明 |
|------|------|
| **MVP** | Minimum Viable Product，最小可行產品。 |
| **RBAC** | Role‑Based Access Control，角色基礎存取控制。 |
| **COPPA** | Children’s Online Privacy Protection Act（美國兒童線上隱私保護法）。 |
| **GDPR‑Kids** | 歐盟通用資料保護規則針對兒童的擴充規範。 |
| **WCAG** | Web Content Accessibility Guidelines，網頁可及性指引。 |
| **KPI** | Key Performance Indicator，關鍵績效指標。 |

### 14.2 Acronyms  

| Acronym | Full Form |
|---------|------------|
| **API** | Application Programming Interface |
| **UI** | User Interface |
| **UX** | User Experience |
| **CI/CD** | Continuous Integration / Continuous Delivery |
| **DTO** | Data Transfer Object |
| **SQL** | Structured Query Language |
| **PWA** | Progressive Web App |

### 14.3 References  

1. Intent Report – `intent_report.md` (Section 1‑8).  
2. Proposal – `Proposal.md` (Version v1.0, 2026‑05‑10).  
3. Architecture & Task List – `architecture_tasklist.md`.  
4. OpenAPI 3.0 Specification – attached `openapi-spec.yaml`.  
5. WCAG 2.1 AA Checklist – internal QA guide.  

---  

**End of OpenSpec Specification**.  