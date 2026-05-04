# Phase 3 Agent 邏輯開發任務追蹤

- [x] 建立 `ProjectWorkflowManager` 以管理 SSE 與非同步事件隊列 (`backend/core/workflow.py`)
- [x] 更新專案 API (`backend/api/projects.py`)，加入 `/start`、`/reply` 以及更新 `/stream`。
- [x] 實作 `AskUserTool` 工具供 Agent 向使用者提問 (`backend/tools/five_whys.py`)
- [x] 實作 LLM 工廠與 Crew 組裝邏輯 (`backend/core/crew_builder.py`)
- [x] 實作 BA Agent 邏輯 (`backend/agents/ba_agent.py`)
- [x] 實作 PM Agent 邏輯 (`backend/agents/pm_agent.py`)
- [x] 實作 Architect Agent 邏輯 (`backend/agents/architect_agent.py`)
- [x] 實作 Writer Agent 邏輯 (`backend/agents/writer_agent.py`)
- [x] 驗證與測試
