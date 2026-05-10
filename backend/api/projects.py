"""
SpecForge AI — 專案管理 API 路由
提供專案 CRUD 與 SSE 串流端點
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse
import os
import zipfile
import io
import urllib.parse

from backend.core.database import ChatMessage, Project, ProjectVersion, User, get_db
from backend.core.security import get_current_user, verify_token
from backend.core.workflow import ProjectWorkflowManager
from backend.core.crew_builder import run_crew_workflow

router = APIRouter(prefix="/api/projects", tags=["專案管理"])


# ── Request / Response Schemas ──────────────────────────────────────

class ProjectCreateRequest(BaseModel):
    """建立專案請求"""
    name: str = Field(..., min_length=1, max_length=200, description="專案名稱")
    description: Optional[str] = Field(None, description="專案描述")


class ProjectResponse(BaseModel):
    """專案回應"""
    id: int
    user_id: int
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """專案列表回應"""
    projects: List[ProjectResponse]
    total: int


class ProjectVersionResponse(BaseModel):
    """專案版本回應"""
    id: int
    project_id: int
    version_tag: str
    change_summary: Optional[str]
    files_snapshot_path: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ReplyRequest(BaseModel):
    """使用者回覆請求"""
    text: str = Field(..., description="使用者的回答")


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
    """建立一個新的 SpecForge 專案"""
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


@router.delete(
    "/{project_id}",
    summary="刪除專案",
)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """刪除特定專案及其所有相關紀錄"""
    project = await _get_user_project(project_id, current_user.id, db)
    
    # 移除活動中的 Session
    ProjectWorkflowManager.remove_session(project_id)
    
    # 刪除資料庫紀錄
    await db.delete(project)
    await db.commit()

    return {"message": f"Project {project_id} deleted successfully."}


@router.get(
    "/{project_id}/versions",
    response_model=List[ProjectVersionResponse],
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


@router.get(
    "/{project_id}/messages",
    summary="取得專案對話紀錄",
)
async def list_messages(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得特定專案的歷史對話紀錄"""
    await _get_user_project(project_id, current_user.id, db)

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.project_id == project_id)
        .order_by(ChatMessage.timestamp.asc())
    )
    messages = result.scalars().all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "agent": m.agent_type,
            "content": m.content,
            "type": m.msg_type,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in messages
    ]


@router.post(
    "/{project_id}/start",
    summary="啟動專案的 Agent 工作流程",
)
async def start_project_workflow(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """啟動 CrewAI 的工作流程"""
    await _get_user_project(project_id, current_user.id, db)
    session = ProjectWorkflowManager.get_session(project_id)
    
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
    """前端透過此端點提交使用者的回覆，繼續 Agent 的執行"""
    await _get_user_project(project_id, current_user.id, db)
    session = ProjectWorkflowManager.get_session(project_id)
    await session.put_reply(request.text)
    
    return {"message": "Reply received."}


@router.get(
    "/{project_id}/stream",
    summary="SSE 串流端點",
)
async def project_stream(
    project_id: int,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """SSE 串流端點 — 用於即時推播 Agent 訊息"""
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
        
    payload = verify_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    username = payload.get("sub")
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # 確認專案屬於當前用戶
    await _get_user_project(project_id, user.id, db)
    session = ProjectWorkflowManager.get_session(project_id)

    async def event_generator():
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
            pass

    return EventSourceResponse(event_generator())


@router.get(
    "/{project_id}/files",
    summary="取得專案產出的檔案清單",
)
async def list_project_files(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """列出 backend/docs/ 下所有屬於該專案的 .md 檔案"""
    await _get_user_project(project_id, current_user.id, db)
    
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
    if not os.path.exists(docs_dir):
        return []

    files = []
    suffix = f"_{project_id}.md"
    
    for filename in os.listdir(docs_dir):
        if filename.endswith(suffix):
            # 建立友善的顯示名稱
            display_name = filename.replace(suffix, "").replace("_", " ").title()
            files.append({
                "filename": filename,
                "display_name": display_name,
                "size": os.path.getsize(os.path.join(docs_dir, filename)),
                "updated_at": datetime.fromtimestamp(os.path.getmtime(os.path.join(docs_dir, filename))).isoformat()
            })
    
    # 依照修改時間排序
    files.sort(key=lambda x: x["updated_at"])
    return files


@router.get(
    "/{project_id}/files/{filename}",
    summary="讀取或下載特定檔案",
)
async def get_project_file(
    project_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """讀取或下載特定檔案，支援 Authorization Header 或 Query Token"""
    # 如果 current_user 是由 Depends(get_current_user) 取得，代表 Header 驗證已過
    # 如果沒過，Depends(get_current_user) 會噴 401，我們需要在這裡處理 Query Token 的情況
    # 但為了簡化，我們可以直接在 get_current_user 裡實作 Query Token 支援
    """取得特定檔案內容"""
    await _get_user_project(project_id, current_user.id, db)
    
    # 安全檢查：確保檔案名稱符合預期格式，防止路徑穿越攻擊
    if not filename.endswith(f"_{project_id}.md") or ".." in filename:
        raise HTTPException(status_code=403, detail="無權存取此檔案")

    docs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
    file_path = os.path.join(docs_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="檔案不存在")

    safe_filename = urllib.parse.quote(filename)
    
    with open(file_path, "rb") as f:
        content = f.read()

    # 使用 FastAPI 最標準的 FileResponse，並確保檔名參數正確
    return FileResponse(
        file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get(
    "/{project_id}/download-all",
    summary="打包下載所有產出物 (ZIP)",
)
async def download_project_zip(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """將專案的所有 .md 產出物打包成 ZIP 下載"""
    project = await _get_user_project(project_id, current_user.id, db)
    
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
    suffix = f"_{project_id}.md"
    
    # 收集檔案
    project_files = [f for f in os.listdir(docs_dir) if f.endswith(suffix)] if os.path.exists(docs_dir) else []
    
    if not project_files:
        raise HTTPException(status_code=404, detail="目前尚無產出檔案可供下載")

    # 建立記憶體中的 ZIP 檔案
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for filename in project_files:
            file_path = os.path.join(docs_dir, filename)
            zip_file.write(file_path, arcname=filename)
    
    zip_buffer.seek(0)
    zip_data = zip_buffer.getvalue()
    zip_buffer.close()
    
    # 處理中文檔名編碼
    safe_name = urllib.parse.quote(project.name.replace(' ', '_'))
    zip_filename = f"SpecForge_Project_{project_id}_{safe_name}.zip"
    
    return Response(
        content=zip_data,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"'
        }
    )
