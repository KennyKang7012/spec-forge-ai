"""
SpecForge AI — 設定管理 API 路由
提供 LLM 供應商切換與 SKILL 對答問題配置
"""

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import LLMConfig, SkillConfig, User, get_db
from backend.core.llm_provider import LLMProviderFactory, reset_llm_provider
from backend.core.security import get_current_user

router = APIRouter(prefix="/api/settings", tags=["設定管理"])

# ── 載入預設 SKILL 設定 ─────────────────────────────────────────────
_DEFAULT_SKILLS_PATH = Path(__file__).parent.parent / "config" / "default_skills.json"


def _load_default_skills() -> dict:
    """載入預設 SKILL 對答問題設定"""
    with open(_DEFAULT_SKILLS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ── Request / Response Schemas ──────────────────────────────────────

class LLMConfigResponse(BaseModel):
    """LLM 設定回應"""
    provider: str
    model_name: str
    base_url: str | None = None
    is_default: bool = True
    available_providers: list[str]


class LLMConfigUpdateRequest(BaseModel):
    """更新 LLM 設定請求"""
    provider: str = Field(..., description="供應商名稱 (ollama/openai/google/openrouter/nvidia/custom)")
    model_name: str = Field(..., description="模型名稱")
    api_key: str | None = Field(None, description="API Key（將加密儲存）")
    base_url: str | None = Field(None, description="自訂 API 端點")


class SkillConfigResponse(BaseModel):
    """SKILL 設定回應"""
    skill_name: str
    config: dict


class SkillConfigUpdateRequest(BaseModel):
    """更新 SKILL 設定請求"""
    custom_questions: list[str] | None = Field(None, description="自訂對答問題列表")
    max_rounds: int | None = Field(None, ge=1, le=20, description="最大提問輪次")


class MessageResponse(BaseModel):
    """通用訊息回應"""
    message: str


# ── LLM 設定端點 ────────────────────────────────────────────────────

@router.get(
    "/llm",
    response_model=LLMConfigResponse,
    summary="取得 LLM 供應商設定",
)
async def get_llm_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取得當前用戶的 LLM 供應商設定"""
    # 先查詢用戶自訂設定
    result = await db.execute(
        select(LLMConfig).where(
            LLMConfig.user_id == current_user.id,
            LLMConfig.is_default == True,
        )
    )
    user_config = result.scalar_one_or_none()

    if user_config:
        return LLMConfigResponse(
            provider=user_config.provider,
            model_name=user_config.model_name,
            base_url=user_config.base_url,
            is_default=user_config.is_default,
            available_providers=LLMProviderFactory.list_providers(),
        )

    # 沒有自訂設定，回傳 .env 預設值
    from backend.core.config import get_settings
    settings = get_settings()
    return LLMConfigResponse(
        provider=settings.llm_provider,
        model_name=settings.llm_model,
        is_default=True,
        available_providers=LLMProviderFactory.list_providers(),
    )


@router.put(
    "/llm",
    response_model=MessageResponse,
    summary="更新 LLM 供應商設定",
)
async def update_llm_config(
    request: LLMConfigUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    更新 LLM 供應商設定

    切換供應商後會重新初始化 LLM client
    """
    # 驗證供應商名稱
    if request.provider not in LLMProviderFactory.list_providers():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支援的供應商: {request.provider}",
        )

    # 查詢或建立用戶的 LLM 設定
    result = await db.execute(
        select(LLMConfig).where(
            LLMConfig.user_id == current_user.id,
            LLMConfig.is_default == True,
        )
    )
    config = result.scalar_one_or_none()

    if config:
        config.provider = request.provider
        config.model_name = request.model_name
        config.api_key_encrypted = request.api_key  # TODO: Phase 2 加密
        config.base_url = request.base_url
    else:
        config = LLMConfig(
            user_id=current_user.id,
            provider=request.provider,
            model_name=request.model_name,
            api_key_encrypted=request.api_key,
            base_url=request.base_url,
            is_default=True,
        )
        db.add(config)

    await db.flush()

    # 重設 LLM provider，下次呼叫時會使用新設定
    reset_llm_provider()

    return MessageResponse(message=f"LLM 供應商已切換為 {request.provider} ({request.model_name})")


# ── SKILL 設定端點 ──────────────────────────────────────────────────

@router.get(
    "/skills",
    response_model=list[SkillConfigResponse],
    summary="取得所有 SKILL 對答設定",
)
async def get_skills_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    取得所有 SKILL 的對答問題設定

    優先回傳用戶自訂設定，否則回傳預設值
    """
    default_skills = _load_default_skills()

    # 查詢用戶自訂設定
    result = await db.execute(
        select(SkillConfig).where(SkillConfig.user_id == current_user.id)
    )
    user_configs = {sc.skill_name: sc for sc in result.scalars().all()}

    skills_response = []
    for skill_name, default_config in default_skills.get("skills", {}).items():
        config = dict(default_config)

        # 用戶有自訂設定則覆蓋
        if skill_name in user_configs:
            user_cfg = user_configs[skill_name]
            if user_cfg.custom_questions_json:
                custom_q = json.loads(user_cfg.custom_questions_json)
                config["custom_questions"] = custom_q
            if user_cfg.max_rounds:
                config["max_rounds"] = user_cfg.max_rounds

        skills_response.append(SkillConfigResponse(
            skill_name=skill_name,
            config=config,
        ))

    return skills_response


@router.put(
    "/skills/{skill_name}",
    response_model=MessageResponse,
    summary="更新特定 SKILL 對答問題",
)
async def update_skill_config(
    skill_name: str,
    request: SkillConfigUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    更新特定 SKILL 的對答問題與設定

    - **skill_name**: SKILL 名稱（如 SKILL-01_intent_discovery）
    - **custom_questions**: 自訂對答問題列表
    - **max_rounds**: 最大提問輪次
    """
    # 驗證 SKILL 名稱
    default_skills = _load_default_skills()
    if skill_name not in default_skills.get("skills", {}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SKILL '{skill_name}' 不存在",
        )

    # 查詢或建立用戶的 SKILL 設定
    result = await db.execute(
        select(SkillConfig).where(
            SkillConfig.user_id == current_user.id,
            SkillConfig.skill_name == skill_name,
        )
    )
    config = result.scalar_one_or_none()

    if config:
        if request.custom_questions is not None:
            config.custom_questions_json = json.dumps(request.custom_questions, ensure_ascii=False)
        if request.max_rounds is not None:
            config.max_rounds = request.max_rounds
    else:
        config = SkillConfig(
            user_id=current_user.id,
            skill_name=skill_name,
            custom_questions_json=(
                json.dumps(request.custom_questions, ensure_ascii=False)
                if request.custom_questions else None
            ),
            max_rounds=request.max_rounds or 7,
        )
        db.add(config)

    await db.flush()

    return MessageResponse(message=f"SKILL '{skill_name}' 設定已更新")
