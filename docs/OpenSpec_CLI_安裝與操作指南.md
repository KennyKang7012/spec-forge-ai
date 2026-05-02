# OpenSpec CLI 安裝與操作指南

> **適用對象：** SpecForge AI 開發者
> **日期：** 2026-05-02

---

## 1. 前置需求

- **Node.js** v20.19.0 以上
- **npm** (隨 Node.js 安裝)

確認版本：
```bash
node --version    # 需 >= v20.19.0
npm --version
```

---

## 2. 安裝 OpenSpec CLI

```bash
# 全域安裝
npm install -g @fission-ai/openspec@latest

# 驗證安裝
openspec --version
```

---

## 3. 在專案中初始化

```bash
# 進入專案根目錄
cd /Users/kennykang/Desktop/VibeProj/spec-forge-ai

# 初始化 OpenSpec
openspec init
```

這會在專案根目錄建立 `openspec/` 目錄，結構如下：

```
openspec/
├── config.yaml        # 專案設定（技術棧、編碼規範等）
├── specs/             # 規格文件的「真相來源」(Source of Truth)
└── changes/           # 變更提案目錄
    └── <change-id>/
        ├── proposal.md   # 提案說明（為什麼要做這個變更）
        ├── design.md     # 技術設計（怎麼做）
        ├── tasks.md      # 開發任務清單
        └── spec.md       # 差異規格（ADDED / MODIFIED / REMOVED）
```

---

## 4. 核心指令

### 4.1 `openspec propose` — 建立變更提案

```bash
# 透過 AI 助手觸發，或手動建立
openspec propose
```

產出檔案：`proposal.md`, `design.md`, `tasks.md`, `spec.md`

### 4.2 `openspec validate` — 驗證規格文件

```bash
# 驗證特定變更
openspec validate <change-id>

# 嚴格模式（檢查規範用語如 SHALL, MUST 等）
openspec validate <change-id> --strict

# 驗證所有變更
openspec validate --all

# JSON 輸出（適合 CI/CD）
openspec validate <change-id> --json
```

### 4.3 `openspec archive` — 歸檔已完成的變更

```bash
openspec archive <change-id>
```

將變更中的差異規格合併到 `specs/` 主規格目錄。

---

## 5. 工作流程（SDD Loop）

```
1. Propose（提案）→ 定義要做什麼、為什麼做
2. Design（設計）→ 技術方案
3. Implement（實作）→ 根據 tasks.md 開發
4. Validate（驗證）→ 確認規格正確
5. Archive（歸檔）→ 合併到主規格
```

---

## 6. 什麼是 Mock 開發？

**Mock 開發**是指在某個外部工具或服務**尚未準備好**時，先用「模擬的假資料/假回應」來代替，讓其他部分的開發可以先行推進。

### 以 OpenSpec CLI 為例：

在 SpecForge AI 中，Writer Agent 需要呼叫 `openspec validate` 來驗證文件。如果 OpenSpec CLI 還沒安裝或有問題，我們可以：

```python
# Mock 版本 — 模擬 openspec validate 的回應
def mock_openspec_validate(file_path):
    """模擬 OpenSpec CLI 的驗證結果"""
    return {
        "status": "pass",           # 或 "fail"
        "errors": [],               # 模擬的錯誤列表
        "warnings": [],
        "file": file_path
    }

# 真實版本 — 實際呼叫 CLI
def real_openspec_validate(file_path):
    import subprocess
    result = subprocess.run(
        ["openspec", "validate", file_path, "--json"],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)
```

### Mock 的好處：
- ✅ 不需等待外部工具就能開始開發
- ✅ 可以先驗證整體流程是否正確
- ✅ 等 CLI 準備好後，只需切換到真實實作即可

### 建議策略：
**先安裝 OpenSpec CLI 試用**。如果安裝順利，就直接使用真實 CLI；如果遇到問題，再切換為 Mock 模式繼續開發。
