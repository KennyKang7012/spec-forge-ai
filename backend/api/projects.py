"""
SpecForge AI — 專案管理 API 路由
提供專案 CRUD 與 SSE 串流端點
"""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from backend.core.database import Project, ProjectVersion, User, get_db
from backend.core.security import get_current_user
from backend.core.workflow import ProjectWorkflowManager

router = APIRouter(prefix="/api/projects", tags=["專案管理"])


# ── Request / Response Schemas ──────────────────────────────────────

class ProjectCreateRequest(BaseModel):
    """建立專案請求"""
    name: str = Field(..., min_length=1, max_length=200, description="專案名稱")
    description: str | None = Field(None, description="專案描述")


class ProjectResponse(BaseModel):
    """專案回應"""
    id: int
    user_id: int
    name: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """專案列表回應"""
    projects: list[ProjectResponse]
    total: int


class ProjectVersionResponse(BaseModel):
    """專案版本回應"""
    id: int
    project_id: int
    version_tag: str
    change_summary: str | None
    files_snapshot_path: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReplyRequest(BaseModel):
    """使用者回覆請求"""
    text: str = Field(..., description="使用者的回答")


# ── Endpoints ───────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="建立新專案",
)
async def create_project(
    request: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    建立一個新的 SpecForge 專案

    - **name**: 專案名稱
    - **description**: 專案描述（可選）
    """
    project = Project(
        user_id=current_user.id,
        name=request.name,
        description=request.description,
        status="created",
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="列出所有專案",
)
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """列出當前用戶的所有專案"""
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()

    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        total=len(projects),
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="取得專案詳情",
)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得特定專案的詳細資訊"""
    project = await _get_user_project(project_id, current_user.id, db)
    return ProjectResponse.model_validate(project)


@router.get(
    "/{project_id}/versions",
    response_model=list[ProjectVersionResponse],
    summary="取得專案版本歷程",
)
async def list_versions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得特定專案的版本歷程列表"""
    # 確認專案屬於當前用戶
    await _get_user_project(project_id, current_user.id, db)

    result = await db.execute(
        select(ProjectVersion)
        .where(ProjectVersion.project_id == project_id)
        .order_by(ProjectVersion.created_at.desc())
    )
    versions = result.scalars().all()

    return [ProjectVersionResponse.model_validate(v) for v in versions]


@router.post(
    "/{project_id}/start",
    summary="啟動專案的 Agent 工作流程",
)
async def start_project_workflow(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    啟動 CrewAI 的工作流程
    """
    await _get_user_project(project_id, current_user.id, db)
    
    session = ProjectWorkflowManager.get_session(project_id)
    
    # 這裡暫時只發送一條訊息，之後會匯入並執行 Crew 邏輯
    from backend.core.crew_builder import run_crew_workflow
    
    if session.task is None or session.task.done():
        session.task = asyncio.create_task(run_crew_workflow(project_id))
    
    return {"message": "Workflow started."}


@router.post(
    "/{project_id}/reply",
    summary="回覆 Agent 的問題",
)
async def reply_to_agent(
    project_id: int,
    request: ReplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    前端透過此端點提交使用者的回覆，繼續 Agent 的執行
    """
    await _get_user_project(project_id, current_user.id, db)
    session = ProjectWorkflowManager.get_session(project_id)
    
    # 將回覆放入隊列中
    await session.put_reply(request.text)
    
    return {"message": "Reply received."}


@router.get(
    "/{project_id}/stream",
    summary="SSE 串流端點",
)
async def project_stream(
    project_id: int,
    token: str | None = None, # SSE 從 query string 拿 token
    db: AsyncSession = Depends(get_db),
):
    """
    SSE 串流端點 — 用於即時推播 Agent 訊息
    """
    # 簡易解析 Token 取得用戶 (因為 EventSource 無法傳送 Header)
    from backend.core.security import verify_token
    from fastapi import HTTPException
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
        
    payload = verify_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    username = payload.get("sub")
    from backend.core.database import User
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    user_id = user.id
    # 確認專案屬於當前用戶
    await _get_user_project(project_id, user_id, db)
    
    session = ProjectWorkflowManager.get_session(project_id)

    async def event_generator():
        """SSE 事件產生器"""
        # 連線確認事件
        yield {
            "event": "connected",
            "data": json.dumps({
                "project_id": project_id,
                "message": "SSE 連線已建立",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }

        try:
            while True:
                # 等待下一個隊列事件，並與 heartbeat 並發
                # 使用 asyncio.wait 以便每 30 秒送出一次 heartbeat
                get_event_task = asyncio.create_task(session.get_next_sse_event())
                timeout_task = asyncio.create_task(asyncio.sleep(30))
                
                done, pending = await asyncio.wait(
                    [get_event_task, timeout_task], 
                    return_when=asyncio.FIRST_COMPLETED
                )
                
                if get_event_task in done:
                    timeout_task.cancel()
                    event = get_event_task.result()
                    yield event
                else:
                    get_event_task.cancel()
                    yield {
                        "event": "heartbeat",
                        "data": json.dumps({
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }),
                    }
        except asyncio.CancelledError:
            # 客戶端斷線
            pass

    return EventSourceResponse(event_generator())


# ── Helper Functions ────────────────────────────────────────────────

async def _get_user_project(
    project_id: int,
    user_id: int,
    db: AsyncSession,
) -> Project:
    """取得屬於特定用戶的專案，不存在或非擁有者則 404"""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id,
        )
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"專案 #{project_id} 不存在或無權存取",
        )

    return project
