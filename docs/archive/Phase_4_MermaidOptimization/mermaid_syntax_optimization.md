# Mermaid 語法優化與 Agent 源頭修復 (2026-05-10 補充)

針對 Phase 4 產出文件中出現的 Mermaid 圖表渲染錯誤，進行了深層修復與源頭規格化。

## 1. 核心問題修復
- **Mermaid 語法報錯**：解決了 GitHub 與 VS Code 渲染器對特殊字元（`/`, `&`, `( )`, 空格）不相容的問題。
- **全量引號強化**：為產出文件（`design_and_tasks_x.md`）中的所有節點標籤與子圖名稱強制加上雙引號 `""`。
- **連線語法優化**：移除了連線語句中的冗餘標籤定義，統一使用 ID 進行連線。

## 2. Agent 源頭修正
為了防止問題再次發生，已直接更新以下兩個源頭程式碼的底層提示詞（Backstory）：

1.  **[architect_agent.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/agents/architect_agent.py)**：
    - 加入嚴格的 Mermaid 格式規範，確保架構圖（`design_and_tasks_x.md`）產出即符合標準。
2.  **[writer_agent.py](file:///Users/kennykang/Desktop/VibeProj/spec-forge-ai/backend/agents/writer_agent.py)**：
    - 同步更新規範，確保最終規格收斂文件（`final_specs_x.md`）中的所有圖表語法正確。

## 3. 歸檔文件
- **修正後的文件**：已保留在 `backend/docs/` 目錄下供前端調用。
- **格式規範**：
    - 節點：`ID["Label"]`
    - 子圖：`subgraph ID["Label"]`
    - 換行：`<br/>` (取代 `\n`)

---
**本項優化已併入 Phase 4 知識庫，確保後續生成的規格書皆具備生產級的展示品質。**
