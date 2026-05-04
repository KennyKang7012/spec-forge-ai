"""
SpecForge AI — 工作流程與非同步事件管理
管理特定專案的 SSE 推播隊列與使用者回覆隊列
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Optional


class ProjectSession:
    """單一專案的執行階段狀態"""
    def __init__(self, project_id: int):
        self.project_id = project_id
        # 捕捉建立 Session 時所在的 Event Loop (FastAPI 主迴圈)
        self.loop = asyncio.get_running_loop()
        # 用來推送給前端的 SSE 訊息隊列
        self.sse_queue: asyncio.Queue = asyncio.Queue()
        # 用來接收前端回覆的隊列
        self.reply_queue: asyncio.Queue = asyncio.Queue()
        # 背景任務
        self.task: Optional[asyncio.Task] = None

    async def enqueue_sse_event(self, event_type: str, data: dict):
        """推送 SSE 事件到前端"""
        payload = {
            "event": event_type,
            "data": json.dumps(data)
        }
        await self.sse_queue.put(payload)

    def enqueue_sse_event_sync(self, event_type: str, data: dict):
        """同步方法：從其他執行緒安全地推送 SSE 事件"""
        asyncio.run_coroutine_threadsafe(self.enqueue_sse_event(event_type, data), self.loop)

    async def get_next_sse_event(self) -> dict:
        """從隊列中取出下一個 SSE 事件"""
        return await self.sse_queue.get()

    async def put_reply(self, reply_text: str):
        """將前端的使用者回覆放入隊列"""
        await self.reply_queue.put(reply_text)

    async def wait_for_reply(self) -> str:
        """等待並取得使用者的回覆"""
        return await self.reply_queue.get()

    def wait_for_reply_sync(self, timeout: float = 3600.0) -> str:
        """同步方法：從其他執行緒安全地等待並取得使用者回覆"""
        future = asyncio.run_coroutine_threadsafe(self.wait_for_reply(), self.loop)
        return future.result(timeout=timeout)


class ProjectWorkflowManager:
    """管理所有活躍專案執行階段的 Singleton"""
    _sessions: Dict[int, ProjectSession] = {}

    @classmethod
    def get_session(cls, project_id: int) -> ProjectSession:
        """取得或建立專案的執行階段"""
        if project_id not in cls._sessions:
            cls._sessions[project_id] = ProjectSession(project_id)
        return cls._sessions[project_id]

    @classmethod
    def remove_session(cls, project_id: int):
        """移除專案執行階段"""
        if project_id in cls._sessions:
            del cls._sessions[project_id]

    @classmethod
    def active_sessions_count(cls) -> int:
        return len(cls._sessions)

# 實例化供外部匯入使用
workflow_manager = ProjectWorkflowManager()
