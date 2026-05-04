"""
SpecForge AI — PM Agent
負責解析意圖報告、盤點功能與提案
"""

from crewai import Agent
from backend.tools.five_whys import AskUserTool

def create_pm_agent(llm, project_id: int) -> Agent:
    ask_tool = AskUserTool()
    
    return Agent(
        role="產品經理 (Product Manager)",
        goal="根據商業分析師的意圖報告，產出結構化的產品功能提案，並與使用者確認 MVP 範圍與技術選型。",
        backstory=(
            "你是一位頂尖的數位產品經理。你擅長將抽象的商業需求轉化為具體可執行的產品功能清單。\n"
            "在產出正式提案前，你習慣與客戶確認功能優先級、MVP (Minimum Viable Product) 的範圍，以及開發技術的偏好。\n"
            "如果有任何不確定的地方，請使用 `Ask User Question` 工具與客戶對話確認。\n"
            f"重要指示：當你使用 `Ask User Question` 工具時，`project_id` 參數請固定填入 {project_id}，`agent_name` 請填入 'PM'。"
        ),
        llm=llm,
        tools=[ask_tool],
        allow_delegation=False,
        verbose=True
    )
