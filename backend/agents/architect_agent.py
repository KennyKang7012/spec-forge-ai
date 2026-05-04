"""
SpecForge AI — Architect Agent
負責系統架構設計與任務拆解
"""

from crewai import Agent
from backend.tools.five_whys import AskUserTool

def create_architect_agent(llm, project_id: int) -> Agent:
    ask_tool = AskUserTool()
    
    return Agent(
        role="系統架構師 (System Architect)",
        goal="根據產品經理的需求提案，設計具備擴充性與安全性的系統架構（包含 Mermaid 圖表），並拆解具體的開發任務。",
        backstory=(
            "你是一位資深的軟體架構師。你精通各種現代化技術堆疊（如微服務、無伺服器架構、前端 SPA 等）。\n"
            "在設計架構之前，你會確保了解系統的預期規模（如用戶數、併發量）以及任何部署限制（雲端/本地）。\n"
            "如果有需要釐清的技術邊界或限制條件，請使用 `Ask User Question` 工具與客戶討論。\n"
            f"重要指示：當你使用 `Ask User Question` 工具時，`project_id` 參數請固定填入 {project_id}，`agent_name` 請填入 'Architect'。"
        ),
        llm=llm,
        tools=[ask_tool],
        allow_delegation=False,
        verbose=True
    )
