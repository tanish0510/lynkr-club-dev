"""
LLM abstraction layer – OpenAI / Gemini, retries, timeouts, fallback, JSON enforcement.
Structured response only; no free-text hallucinations propagated.
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar

from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMClientInterface(ABC):
    """Abstract LLM client; swap providers via dependency injection."""

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        *,
        system_prompt: Optional[str] = None,
        response_schema: Optional[Type[T]] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2,
    ) -> str | T:
        """
        Send prompt and return raw string or parsed Pydantic model.
        If response_schema is provided, response is validated and returned as that type.
        """
        ...


class OpenAIClient(LLMClientInterface):
    """OpenAI-backed LLM client with retries, timeout, fallback model."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        fallback_model: str = "gpt-3.5-turbo",
        timeout_seconds: float = 30.0,
        max_retries: int = 2,
    ):
        self._api_key = api_key
        self._model = model
        self._fallback_model = fallback_model
        self._timeout = timeout_seconds
        self._max_retries = max_retries
        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=self._api_key)
            except Exception as e:
                logger.warning("OpenAI client init failed: %s", e)
                raise
        return self._client

    async def complete(
        self,
        prompt: str,
        *,
        system_prompt: Optional[str] = None,
        response_schema: Optional[Type[T]] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2,
    ) -> str | T:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        if response_schema:
            # Request JSON; we validate after
            messages.append({
                "role": "system",
                "content": "Respond with valid JSON only, no markdown or extra text.",
            })

        last_error: Optional[Exception] = None
        for attempt in range(self._max_retries + 1):
            model = self._model if attempt == 0 else self._fallback_model
            try:
                client = self._get_client()
                resp = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout=self._timeout,
                )
                text = (resp.choices[0].message.content or "").strip()
                # Strip markdown code block if present
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(
                        l for l in lines
                        if not l.strip().startswith("```")
                    )
                if response_schema:
                    data = json.loads(text)
                    return response_schema.model_validate(data)
                return text
            except json.JSONDecodeError as e:
                last_error = e
                logger.warning("LLM JSON parse attempt %s failed: %s", attempt + 1, e)
            except Exception as e:
                last_error = e
                logger.warning("LLM call attempt %s failed: %s", attempt + 1, e)

        if last_error:
            raise last_error
        raise RuntimeError("LLM complete failed after retries")


class GeminiClient(LLMClientInterface):
    """Gemini-backed LLM client using google-generativeai."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.0-flash",
        timeout_seconds: float = 30.0,
        max_retries: int = 2,
    ):
        self._api_key = api_key
        self._model = model
        self._timeout = timeout_seconds
        self._max_retries = max_retries
        self._model_instance = None

    def _get_model(self):
        if self._model_instance is None:
            import google.generativeai as genai
            genai.configure(api_key=self._api_key)
            self._model_instance = genai.GenerativeModel(self._model)
        return self._model_instance

    async def complete(
        self,
        prompt: str,
        *,
        system_prompt: Optional[str] = None,
        response_schema: Optional[Type[T]] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2,
    ) -> str | T:
        import asyncio
        full_prompt = (system_prompt + "\n\n" + prompt) if system_prompt else prompt
        model = self._get_model()
        last_error = None
        for attempt in range(self._max_retries + 1):
            try:
                response = await asyncio.to_thread(
                    model.generate_content,
                    full_prompt,
                    generation_config={
                        "max_output_tokens": max_tokens,
                        "temperature": temperature,
                    },
                )
                text = getattr(response, "text", None) or ""
                if hasattr(response, "candidates") and response.candidates and not text:
                    part = response.candidates[0].content.parts[0]
                    text = getattr(part, "text", "") or ""
                text = (text or "").strip()
                if response_schema:
                    data = json.loads(text)
                    return response_schema.model_validate(data)
                return text
            except Exception as e:
                last_error = e
                logger.warning("Gemini attempt %s failed: %s", attempt + 1, e)
        if last_error:
            raise last_error
        raise RuntimeError("Gemini complete failed after retries")
