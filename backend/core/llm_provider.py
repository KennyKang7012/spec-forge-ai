"""
SpecForge AI — LLM 供應商抽象層
支援 Ollama / OpenAI / Google Gemini / OpenRouter / Nvidia / Custom
所有 OpenAI 兼容供應商統一使用 openai SDK，僅切換 base_url + api_key
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator

from openai import AsyncOpenAI

from backend.core.config import Settings, get_settings


# ── 抽象基底類別 ────────────────────────────────────────────────────

class BaseLLMProvider(ABC):
    """LLM 供應商抽象介面"""

    provider_name: str = "base"

    @abstractmethod
    async def chat(self, messages: list[dict], **kwargs) -> str:
        """
        同步式聊天（等待完整回應）

        Args:
            messages: OpenAI 格式的訊息列表
                      [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
        Returns:
            完整回應文字
        """
        ...

    @abstractmethod
    async def stream_chat(self, messages: list[dict], **kwargs) -> AsyncGenerator[str, None]:
        """
        串流式聊天（逐 token 回傳）

        Args:
            messages: OpenAI 格式的訊息列表
        Yields:
            每次回傳一個 text chunk
        """
        ...

    def get_info(self) -> dict:
        """取得供應商資訊"""
        return {
            "provider": self.provider_name,
            "model": getattr(self, "model", "unknown"),
        }


# ── OpenAI 兼容供應商基底 ──────────────────────────────────────────

class OpenAICompatibleProvider(BaseLLMProvider):
    """
    所有 OpenAI 兼容 API 的共用實作
    包含：Ollama, OpenAI, OpenRouter, Nvidia, Custom
    """

    def __init__(self, base_url: str, api_key: str, model: str, provider_name: str):
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
        )
        self.model = model
        self.provider_name = provider_name

    async def chat(self, messages: list[dict], **kwargs) -> str:
        """同步式聊天"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 4096),
        )
        return response.choices[0].message.content or ""

    async def stream_chat(self, messages: list[dict], **kwargs) -> AsyncGenerator[str, None]:
        """串流式聊天"""
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 4096),
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


# ── 具體供應商實作 ──────────────────────────────────────────────────

class OllamaProvider(OpenAICompatibleProvider):
    """Ollama 本地 LLM（預設供應商）"""

    def __init__(self, settings: Settings):
        super().__init__(
            base_url=settings.ollama_base_url,
            api_key="ollama",  # Ollama 不需要 API key，但 SDK 需要非空值
            model=settings.llm_model,
            provider_name="ollama",
        )


class OpenAIProvider(OpenAICompatibleProvider):
    """OpenAI API"""

    def __init__(self, settings: Settings):
        super().__init__(
            base_url="https://api.openai.com/v1",
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            provider_name="openai",
        )


class OpenRouterProvider(OpenAICompatibleProvider):
    """OpenRouter API"""

    def __init__(self, settings: Settings):
        super().__init__(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
            provider_name="openrouter",
        )


class NvidiaProvider(OpenAICompatibleProvider):
    """Nvidia API"""

    def __init__(self, settings: Settings):
        super().__init__(
            base_url=settings.nvidia_base_url,
            api_key=settings.nvidia_api_key,
            model=settings.nvidia_model,
            provider_name="nvidia",
        )


class CustomProvider(OpenAICompatibleProvider):
    """自訂 LLM Server（任何 OpenAI 兼容 API）"""

    def __init__(self, settings: Settings):
        super().__init__(
            base_url=settings.custom_llm_base_url,
            api_key=settings.custom_llm_api_key or "no-key",
            model=settings.custom_llm_model,
            provider_name="custom",
        )


class GoogleProvider(BaseLLMProvider):
    """
    Google Gemini API
    使用 google-generativeai SDK（非 OpenAI 兼容）
    """

    provider_name = "google"

    def __init__(self, settings: Settings):
        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        self.model_name = settings.google_model
        self.model = settings.google_model
        self._genai = genai

    async def chat(self, messages: list[dict], **kwargs) -> str:
        """同步式聊天 — 將 OpenAI 格式轉換為 Gemini 格式"""
        model = self._genai.GenerativeModel(self.model_name)

        # 轉換訊息格式：OpenAI → Gemini
        gemini_messages = []
        system_instruction = None
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            elif msg["role"] == "user":
                gemini_messages.append({"role": "user", "parts": [msg["content"]]})
            elif msg["role"] == "assistant":
                gemini_messages.append({"role": "model", "parts": [msg["content"]]})

        if system_instruction:
            model = self._genai.GenerativeModel(
                self.model_name,
                system_instruction=system_instruction,
            )

        response = model.generate_content(gemini_messages)
        return response.text or ""

    async def stream_chat(self, messages: list[dict], **kwargs) -> AsyncGenerator[str, None]:
        """串流式聊天"""
        model = self._genai.GenerativeModel(self.model_name)

        gemini_messages = []
        system_instruction = None
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            elif msg["role"] == "user":
                gemini_messages.append({"role": "user", "parts": [msg["content"]]})
            elif msg["role"] == "assistant":
                gemini_messages.append({"role": "model", "parts": [msg["content"]]})

        if system_instruction:
            model = self._genai.GenerativeModel(
                self.model_name,
                system_instruction=system_instruction,
            )

        response = model.generate_content(gemini_messages, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text


# ── 工廠方法 ────────────────────────────────────────────────────────

class LLMProviderFactory:
    """LLM 供應商工廠"""

    _providers: dict[str, type[BaseLLMProvider]] = {
        "ollama": OllamaProvider,
        "openai": OpenAIProvider,
        "google": GoogleProvider,
        "openrouter": OpenRouterProvider,
        "nvidia": NvidiaProvider,
        "custom": CustomProvider,
    }

    @classmethod
    def create(cls, provider_name: str | None = None, settings: Settings | None = None) -> BaseLLMProvider:
        """
        建立 LLM 供應商實例

        Args:
            provider_name: 供應商名稱（預設從 settings 讀取）
            settings: 設定實例（預設使用全域設定）
        """
        if settings is None:
            settings = get_settings()
        if provider_name is None:
            provider_name = settings.llm_provider

        provider_class = cls._providers.get(provider_name)
        if provider_class is None:
            available = ", ".join(cls._providers.keys())
            raise ValueError(
                f"不支援的 LLM 供應商: '{provider_name}'。可用供應商: {available}"
            )

        return provider_class(settings)

    @classmethod
    def list_providers(cls) -> list[str]:
        """列出所有可用的供應商名稱"""
        return list(cls._providers.keys())


# ── FastAPI 依賴注入 ────────────────────────────────────────────────

_default_provider: BaseLLMProvider | None = None


def get_llm_provider() -> BaseLLMProvider:
    """
    FastAPI 依賴注入 — 取得 LLM 供應商實例

    使用模組層級快取，避免每次請求都重建 client
    """
    global _default_provider
    if _default_provider is None:
        _default_provider = LLMProviderFactory.create()
    return _default_provider


def reset_llm_provider():
    """重設 LLM 供應商（用於切換供應商後重新初始化）"""
    global _default_provider
    _default_provider = None
