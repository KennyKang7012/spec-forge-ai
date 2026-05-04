"""
SpecForge AI — 5 Whys & 使用者互動工具
提供 Agent 向使用者提問並等待回覆的能力
"""

from typing import Type

from pydantic import BaseModel, Field
from crewai.tools import BaseTool

from backend.core.workflow import ProjectWorkflowManager


class AskUserInput(BaseModel):
    """AskUserTool 的輸入 Schema"""
    project_id: int = Field(..., description="專案 ID")
    agent_name: str = Field(..., description="提問的 Agent 名稱 (如 BA, PM, Architect)")
    question: str = Field(..., description="要詢問使用者的問題內容")


class AskUserTool(BaseTool):
    name: str = "Ask User Question"
    description: str = (
        "向使用者提出問題，並等待使用者的回答。 "
        "當你需要釐清需求、確認功能、或請求使用者做決定時，請使用此工具。"
    )
    args_schema: Type[BaseModel] = AskUserInput

    def _run(self, project_id: int, agent_name: str, question: str) -> str:
        """
        執行提問邏輯
        注意：CrewAI 的工具預設在獨立的 thread 中執行，
        因此我們需要使用同步安全的方法來與主 Event Loop 溝通。
        """
        try:
            # 取得該專案的 Workflow Session
            session = ProjectWorkflowManager.get_session(project_id)
            
            # 推送問題到 SSE 隊列
            session.enqueue_sse_event_sync(
                event_type="agent_question",
                data={
                    "agent": agent_name,
                    "content": question,
                }
            )
            
            # 阻塞等待使用者的回覆 (透過 API /reply 端點放入 Reply 隊列)
            # 設定一個極長的 timeout (例如 1 小時)，因為使用者可能需要時間思考
            user_reply = session.wait_for_reply_sync(timeout=3600.0)
            
            return user_reply
            
        except Exception as e:
            return f"Error interacting with user: {str(e)}"
