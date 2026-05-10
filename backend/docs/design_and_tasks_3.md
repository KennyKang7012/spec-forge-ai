## 小學二年級英語單詞學習系統 – 架構設計 & 開發任務清單  

### 1. 系統概覽
- **目標使用者**：每日活躍約 100 人（家長、教師、學生），同時併發峰值預估 < 20  個連線。  
- **部署環境**：本地資料中心（位於台灣），符合本地資安法規與資料留存要求。  
- **登入方式**：  
  1. **家長／教師帳號**（需家長同意、最小化個資）  
  2. **匿名 ID**（僅供學生使用，無可辨識個人資訊）  
- **語系**：目前僅支援 **中文 / 英文**（單語系），未規劃多語系。  

---

## 2. 技術架構

```mermaid
graph TD
    %% 外部使用者
    subgraph 用戶端
        A[學生 (Web / Mobile) ] 
        B[家長/教師管理介面]
    end

    %% 前端
    subgraph 前端 (React + TypeScript)
        C[SPA 主程式] --> D[單詞卡片 UI]
        C --> E[配對遊戲 (PixiJS/Canvas)]
        C --> F[積分 & 小物 UI]
        C --> G[學習儀表板 (圖表)]
        C --> H[登入/註冊頁面]
    end

    %% API Gateway（本地負載平衡）    
    subgraph API 層 (Node.js/Express + TypeScript)
        I[RESTful API Gateway] --> J[認證服務 (JWT + 本地 OAuth2)]
        I --> K[單詞服務]
        I --> L[遊戲結果服務]
        I --> M[進度/積分服務]
        I --> N[後台管理服務]
    end

    %% 資料層
    subgraph 資料層
        O[PostgreSQL (本地) ] 
        P[Redis (Session / Cache)] 
        Q[檔案儲存 (NAS / 本地 Object Store)] 
    end

    %% 管理介面
    subgraph 後台 (React Admin)
        R[單詞/關卡 CRUD] 
        S[規則設定 (積分/小物)] 
        T[使用者與權限管理] 
    end

    %% 監控 & 分析
    subgraph 監控/分析
        U[Prometheus + Grafana] 
        V[Logstash + Kibana] 
        W[自建 KPI Dashboard] 
    end

    %% 流程
    A & B --> H
    H --> J
    J --> I
    I --> K
    I --> L
    I --> M
    I --> N
    K --> O
    L --> O
    M --> O
    N --> O
    N --> Q
    D -->|載入圖片/音檔| Q
    E -->|載入音檔/動畫| Q
    F -->|即時積分| P
    G -->|查詢進度| O
    R --> N
    S --> N
    T --> N
    I --> P
    I --> U
    I --> V
    U --> W
    V --> W
```

### 2.1 主要元件說明
| 層級 | 元件 | 功能 | 主要技術 |
|------|------|------|----------|
| **前端 UI** | SPA (React + TypeScript) | 學生端與家長/教師端共用 UI，支援 PC、Tablet、手機瀏覽器 | React, React‑Router, Styled‑Components, i18n (僅中英) |
| **遊戲渲染** | PixiJS / HTML5 Canvas | 點擊配對、動畫、音效回饋 | PixiJS、Web Audio API、preload.js |
| **API Gateway** | Express (Node.js) + TypeScript | 統一入口、路由、錯誤處理、限流 | Express, cors, helmet, rate‑limit |
| **認證** | JWT + 本地 OAuth2 Provider | 家長/教師登入、匿名 ID 產生、家長同意流程 | jsonwebtoken, oauth2orize, bcrypt |
| **業務服務** | 單詞、遊戲結果、進度、後台 | CRUD、統計、積分計算 | Service‑layer pattern, TypeORM |
| **資料庫** | PostgreSQL | 結構化資料：單詞、使用者、關卡、積分、日志 | pgSQL, Sequelize/TypeORM |
| **快取** | Redis | Session、短期積分快取、遊戲即時排行榜（未列入 MVP） | redis |
| **檔案儲存** | 本地 NAS / Object Store (如 MinIO) | 圖片、音檔、匯出報表 | S3‑compatible API |
| **監控** | Prometheus + Grafana、ELK | 系統健康、API 延遲、資源使用、KPI 收集 | node_exporter, nginx_exporter |
| **CI/CD** | GitHub Actions + Docker | 自動化構建、單元測試、部署到本地 Kubernetes 或 Docker‑Compose | Docker, docker‑compose, Kubernetes (optional) |

### 2.2 安全與合規
- **最小化個資**：僅儲存家長/教師的姓名、 email（必須經父母同意）與匿名學生 ID。  
- **資料所在地**：所有資料庫、檔案儲存、備份皆放在台灣本地資料中心。  
- **加密**：傳輸層 TLS 1.2+（自簽或內部 CA），靜態資料 AES‑256 加密。  
- **認證流程**：家長同意表單 → 建立帳號 → 產生 JWT (短期 1h) + Refresh Token (7d)。  
- **審計日誌**：所有登入、資料變更行為寫入 ELK，保留 180 天。  

---

## 3. 開發任務拆解 (共 45 個子任務)

### 3.1 項目管理 & 基礎設施
| # | 任務 | 估算人日 |
|---|------|----------|
| PM‑1 | 撰寫需求確認書、驗收標準 (含 KPI) | 2 |
| INF‑1 | 本地資料中心網路、伺服器規劃 (2 台 DB + 2 台 API) | 3 |
| INF‑2 | Docker‑Compose / Kubernetes 基礎環境建置 | 4 |
| INF‑3 | CI/CD pipeline (GitHub Actions) 設定 | 3 |
| INF‑4 | TLS / CA 與防火牆規則設定 | 2 |
| INF‑5 | 監控、日誌 (Prometheus + Grafana + ELK) 部署 | 3 |
| INF‑6 | Redis 快取服務安裝與測試 | 2 |
| INF‑7 | 本地 NAS (MinIO) 部署與 CDN 設定 | 3 |
| **小計** |  | **22 人日** |

### 3.2 前端開發
| # | 任務 | 前端人日 |
|---|------|----------|
| FE‑1 | 建立 React + TypeScript 專案、路由與全局樣式框架 | 3 |
| FE‑2 | 登入/註冊頁面 + 家長同意流程 | 4 |
| FE‑3 | 單詞卡片 UI（文字、圖示、發音按鈕） | 3 |
| FE‑4 | 音效預載、Web Audio API 包装 | 2 |
| FE‑5 | 點擊配對遊戲核心（PixiJS 版）| 6 |
| FE‑6 | 成功/失敗動畫與音效回饋 | 3 |
| FE‑7 | 積分條、兌換小物 UI + 動畫 | 3 |
| FE‑8 | 學習儀表板（圓形掌握率、積分折線圖） | 4 |
| FE‑9 | 响應式布局、可訪問性 (ARIA、文字替代) | 3 |
| FE‑10 | 前端單元測試 (Jest + React Testing Library) | 3 |
| **小計** |  | **36 人日** |

### 3.3 後端 API 開發
| # | 任務 | 後端人日 |
|---|------|----------|
| BE‑1 | 專案腳手架 (Node.js + TypeScript + Express) | 2 |
| BE‑2 | 認證服務（JWT、OAuth2、家長同意） | 4 |
| BE‑3 | 單詞服務（CRUD + 播放 URL） | 3 |
| BE‑4 | 遊戲結果服務（記錄正確/錯誤、計算積分） | 3 |
| BE‑5 | 進度/積分服務（每日/總統計、匯出 PDF/CSV） | 3 |
| BE‑6 | 後台管理 API（關卡、規則、使用者管理） | 4 |
| BE‑7 | 資料庫模型設計（TypeORM） & Migration | 3 |
| BE‑8 | Redis 快取層（Session、即時積分） | 2 |
| BE‑9 | 輸入驗證、錯誤處理、速率限制 | 2 |
| BE‑10 | 單元測試 (Mocha/Chai) + API 測試 (SuperTest) | 4 |
| **小計** |  | **32 人日** |

### 3.4 後台管理介面
| # | 任務 | 人日 |
|---|------|------|
| ADMIN‑1 | React‑Admin 框架搭建 | 2 |
| ADMIN‑2 | 單詞/圖示/音檔 CRUD UI + CSV 匯入 | 3 |
| ADMIN‑3 | 關卡/配對題組設定 UI | 3 |
| ADMIN‑4 | 積分與小物兌換規則編輯 UI | 2 |
| ADMIN‑5 | 使用者與權限管理 (家長/教師/匿名) | 3 |
| ADMIN‑6 | 前端整合 API、權限測試 | 2 |
| ADMIN‑7 | UI/UX 可訪問性與國際化基礎 (中英) | 2 |
| **小計** |  | **17 人日** |

### 3.5 測試與驗證
| # | 任務 | 人日 |
|---|------|------|
| QA‑1 | 功能測試案例撰寫 (前端 + 後端) | 3 |
| QA‑2 | 手機/平板跨瀏覽器兼容測試 (Chrome, Safari, Edge) | 4 |
| QA‑3 | 性能測試：點擊→音效 ≤ 200 ms、API 延遲 ≤ 150 ms | 3 |
| QA‑4 | 安全測試：SQL Injection、XSS、CSRF | 3 |
| QA‑5 | 隱私合規審查 (COPPA / GDPR‑Kids) | 2 |
| QA‑6 | 用戶可用性測試（7‑8 歲兒童）| 3 |
| **小計** |  | **18 人日** |

### 3.6 部署、上線與運維
| # | 任務 | 人日 |
|---|------|------|
| OPS‑1 | 產生 Docker 映像、標籤管理 | 2 |
| OPS‑2 | 本地 Kubernetes (或 Docker‑Compose) 部署腳本 | 3 |
| OPS‑3 | 災備與備份方案（PostgreSQL、NAS）| 2 |
| OPS‑4 | 監控告警閥值設定（CPU、RTT、API 錯誤率）| 2 |
| OPS‑5 | 上線前最終資安審查 & 測試報告 | 2 |
| OPS‑6 | Beta 測試環境佈署與用戶手冊發放 | 2 |
| **小計** |  | **13 人日** |

### 3.7 專案總結
| 大項 | 總人日 |
|------|--------|
| 項目管理 & 基礎設施 | 22 |
| 前端 UI & 遊戲 | 36 |
| 後端 API | 32 |
| 後台管理介面 | 17 |
| 測試與驗證 | 18 |
| 部署 & 上線 | 13 |
| **總計** | **138 人日** (約 28 週，依 2‑3 名全職開發者可於 3 個月內完成 MVP) |

---

## 4. 里程碑與交付

| 週次 | 里程碑 |
|------|--------|
| 1‑2 | 需求確認、環境建置、CI/CD、監控基礎 |
| 3‑4 | 前端骨架、登入/認證、後端認證服務 |
| 5‑6 | 單詞卡片 UI + 單詞 API、音效預載 |
| 7‑8 | 點擊配對遊戲核心 + 遊戲結果 API |
| 9‑10 | 積分/小物 UI + 積分服務、Redis 快取 |
| 11‑12 | 後台管理 UI + 後台 API、CSV 匯入 |
| 13‑14 | 測試 (功能、性能、可訪問性)、安全審查 |
| 15 | 部署到本地資料中心、監控與備援 |
| 16 | Beta 內部測試、KPI Dashboard 初版 |
| 17‑18 | 收集回饋、最後優化、正式上線 |

---

## 5. 成功指標驗收

| KPI | 驗收條件 |
|-----|----------|
| **音效回饋延遲** | 95% 以上互動點擊 → 音效 ≤ 200 ms (測試工具自動化) |
| **資料隱私合規** | 完整家長同意流程，所有個資加密存儲，合規審核通過 |
| **同時併發** | 本地測試 20 個同時連線，API 平均回應 ≤ 150 ms |
| **功能完整度** | MVP 5 大功能全部上線、無致命缺陷 (Severity ≥ 3) |
| **使用者可用性** | 7‑8 歲兒童測試 NPS ≥ 30，家長滿意度 NPS ≥ 30 |
| **系統穩定性** | 7 天內系統可用率 ≥ 99.5% |

---

## 6. 後續擴充建議（非 MVP）

| 功能 | 為何值得投資 | 需要的技術或資源 |
|------|--------------|------------------|
| **排行榜與成就徽章** | 社交動機提升，提升活躍度 | 新增 Leaderboard Service、WebSocket 即時推播 |
| **多語系支援 (西班牙文、日文)** | 拓展海外市場 | i18n 框架、翻譯管理平台 |
| **雲端備援 (多 AZ)** | 高可用、災難復原 | 逐步遷移至公有雲 (AWS/Azure) 與跨區資料同步 |
| **付費進階關卡** | 商業化收入來源 | 訂閱制、金流整合 (Stripe / PayPal) |
| **離線模式** | 校園網路不穩定時仍可學習 | Service Worker、PWA 本地緩存 |

---

### 結語
此架構以本地部署、最小化個人資料、簡潔的 React + Node.js 堆疊，完全符合 **每日 100 位活躍使用者**、**同時併發 < 20** 的規模需求。所有功能均以 **模組化、可測試、可擴充** 為設計原則，並提供完整的 **開發任務清單** 與 **里程碑**，讓團隊能在預定 **3 個月** 內交付可供兒童使用、符合資安與隱私法規的 MVP。

如需進一步細化某一子任務的技術細節或測試腳本，請隨時告知。祝開發順利！