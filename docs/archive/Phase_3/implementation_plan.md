# SpecForge AI Phase 3: Agent 邏輯開發

本階段專注於實作 CrewAI 多智能體（Multi-Agent）邏輯，並建立後端 Agent 與前端使用者介面之間的非同步通訊橋樑（SSE）。

## 需要使用者審核的事項

- **非同步的 Human-in-the-Loop（人機協作）整合**：CrewAI 預設使用終端機的 `input()` 來接收人類回饋。由於我們開發的是 Web 應用程式，我們將實作一個自訂工具（`AskUserTool`）與事件匯流排（`asyncio.Queue`）來暫停 Agent 的執行，透過 SSE 將問題傳送給前端，並在前端呼叫 `POST /reply` 端點時恢復執行。
- **LLM 整合**：為了在 CrewAI 中支援多種 LLM 供應商（Ollama、OpenAI、Gemini），我們將根據目前的系統設定動態實例化相對應的 `langchain` LLM 物件，並將其傳遞給各個 Agent。

## 開放性問題（請回覆）

- **Agent 執行期間的狀態持久化**：如果伺服器在 Agent 等待用戶回覆時重新啟動，目前的狀態將會遺失，因為它僅儲存在記憶體中（`asyncio.Queue`）。對於初始版本（MVP）來說，這樣的設計是否可接受？還是我們需要立即實作 Redis / 資料庫來持久化 Agent 的狀態？
- **Agent 產出檔案格式**：中間過程產生的 Markdown 檔案（`intent_report.md`、`proposal.md`、`design.md`、`tasks.md`）應該在工作流程中直接寫入實體檔案系統，還是先保存在記憶體中，等最後一併寫出？

## 提議的變更

---

### 後端 API 與編排邏輯 (Orchestration)

#### [MODIFY] [projects.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/api/projects.py)
- 新增 `POST /api/projects/{id}/start` 端點，以背景任務的形式初始化 CrewAI 工作流程。
- 新增 `POST /api/projects/{id}/reply` 端點，用來接收用戶的回覆並將其推送到等待中的 Agent 任務佇列中。
- 修改 `GET /api/projects/{id}/stream`，使其從綁定於特定專案的 `asyncio.Queue` 中消費訊息，而不是只發送無意義的 heartbeat。

#### [NEW] [workflow.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/core/workflow.py)
- 建立 `ProjectWorkflowManager` 單例（Singleton）來管理活躍的專案工作階段，將事件佇列（SSE 佇列、Reply 佇列）儲存在記憶體中。
- 提供輔助方法將 SSE 訊息加入佇列（例如 `agent_question`、`agent_message`、`doc_stream`）以及取出用戶回覆。

---

### CrewAI Agent 與工具

#### [MODIFY] [ba_agent.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/agents/ba_agent.py)
- 使用 `crewai.Agent` 定義 `BA_Agent`。
- 設定其 backstory（背景）與目標：利用 5 Whys 框架深入理解使用者的意圖。
- 分配 `AskUserTool` 讓它能直接向使用者提問。

#### [MODIFY] [pm_agent.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/agents/pm_agent.py)
- 使用 `crewai.Agent` 定義 `PM_Agent`。
- 設定其 backstory 與目標：解析意圖報告、決定 MVP 範圍並提出功能清單。
- 分配 `AskUserTool` 以便與使用者確認功能與技術堆疊。

#### [MODIFY] [architect_agent.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/agents/architect_agent.py)
- 使用 `crewai.Agent` 定義 `Architect_Agent`。
- 目標：根據提案產生系統架構（Mermaid 圖）與任務拆解。

#### [MODIFY] [writer_agent.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/agents/writer_agent.py)
- 使用 `crewai.Agent` 定義 `Writer_Agent`。
- 目標：彙整出最終的 OpenSpec 格式文件並進行驗證。

#### [MODIFY] [five_whys.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/tools/five_whys.py)
- 實作 `AskUserTool`（繼承自 `crewai.tools.BaseTool`）。
- **邏輯**：當 Agent 呼叫時，它將格式化問題，將 `agent_question` 事件推送到 `ProjectWorkflowManager` 的 SSE 佇列，然後執行阻塞等待（使用 threading events 或 asyncio run_coroutine_threadsafe），直到 `/reply` 端點將回應放入 Reply 佇列為止。

#### [NEW] [crew_builder.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/core/crew_builder.py)
- 建立一個工廠函式，根據 `get_settings()` 建立相對應的 `langchain` LLM 實例。
- 建立函式來組裝包含各階段任務（意圖分析 -> 提案 -> 架構設計 -> 文件撰寫）的 `Crew`，並以非同步的方式啟動它。

## 驗證計畫

### 自動化測試
- 在此階段暫無，傾向透過人工驗證來確保互動流程正確。

### 人工驗證
1. 啟動 FastAPI 後端。
2. 使用 API 客戶端（如 Postman 或 curl）建立一個專案，開啟對 `/stream` 的 SSE 連線，然後呼叫 `/start`。
3. 驗證是否在 SSE 串流中收到 `agent_question` 事件。
4. 呼叫 `/reply` 提供測試用的回答。
5. 驗證 Agent 是否能收到回覆並繼續進行下一個問題，或是完成任務。
6. 驗證 Crew 是否成功產生了中間的 Markdown 輸出檔。
