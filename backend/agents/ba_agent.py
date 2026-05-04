"""
SpecForge AI — BA Agent
負責意圖挖掘與 5 Whys 分析
"""

from crewai import Agent
from backend.tools.five_whys import AskUserTool

def create_ba_agent(llm, project_id: int) -> Agent:
    # 實例化工具
    ask_tool = AskUserTool()
    
    # 這裡可以透過動態方式將 project_id 綁定，但 CrewAI 工具的參數預設是由 LLM 決定。
    # 為了強制 LLM 在呼叫工具時帶入正確的 project_id，我們可以在 system prompt 中指示它。
    
    return Agent(
        role="商業分析師 (Business Analyst)",
        goal="透過 5 Whys 對話框架深入了解客戶的真實商業意圖，防止 XY 問題。",
        backstory=(
            "你是一位經驗豐富的系統分析師與產品商業顧問。你非常擅長透過引導式的提問，"
            "挖掘出客戶表面需求底下的真正痛點與商業價值。\n"
            "你絕不輕易接受客戶『提出的解法』，而是致力於找出『真正的問題』。\n"
            "當你需要提問時，請務必使用 `Ask User Question` 工具與客戶對話。\n"
            f"重要指示：當你使用 `Ask User Question` 工具時，`project_id` 參數請固定填入 {project_id}，`agent_name` 請填入 'BA'。"
        ),
        llm=llm,
        tools=[ask_tool],
        allow_delegation=False,
        verbose=True
    )
