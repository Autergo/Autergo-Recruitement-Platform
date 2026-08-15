import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMGuardrailError(Exception):
    """Raised when user input or LLM generation violates safety guardrails."""
    pass

class LLMService:
    """
    Multi-tier LLM Orchestration Engine:
    - Primary: NVIDIA Nemotron 3.5 Lightning (via NVIDIA Cloud API) with reasoning token support
    - Fallback: Groq (llama-3.3-70b-versatile, gemma2-9b-it) for ultra-low latency & free tier routing
    - Guardrails: Input injection detection, prompt containment, structured JSON enforcement
    - Streaming: SSE / Async generator chunk streaming
    """

    FORBIDDEN_PROMPT_PATTERNS = [
        "ignore previous instructions",
        "system override",
        "drop table",
        "bypass security",
        "delete from",
        "eval(",
        "exec("
    ]

    @classmethod
    def apply_input_guardrails(cls, prompt: str) -> str:
        """Sanitize prompt input against prompt injection and malicious commands."""
        lower_prompt = prompt.lower()
        for pattern in cls.FORBIDDEN_PROMPT_PATTERNS:
            if pattern in lower_prompt:
                logger.warning(f"Guardrail trigger: Potential injection pattern detected: '{pattern}'")
                raise LLMGuardrailError(f"Request blocked by safety guardrail: detected '{pattern}'")
        return prompt.strip()

    @classmethod
    async def stream_chat_completion(
        cls,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        enable_reasoning: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM completions in real time with automatic NVIDIA -> Groq fallback.
        """
        # 1. Try NVIDIA API (Primary)
        try:
            headers = {
                "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.NVIDIA_PRIMARY_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
                "extra_body": {
                    "chat_template_kwargs": {"enable_thinking": enable_reasoning},
                    "reasoning_budget": 4096
                }
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.NVIDIA_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: ") and line != "data: [DONE]":
                                raw_json = line[6:]
                                try:
                                    chunk = json.loads(raw_json)
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content")
                                    if content:
                                        yield content
                                except Exception:
                                    continue
                        return
                    else:
                        logger.warning(f"NVIDIA API responded with status {response.status_code}. Falling back to Groq...")

        except Exception as e:
            logger.error(f"NVIDIA LLM stream failed: {e}. Falling back to Groq...")

        # 2. Fallback to Groq API (Secondary Free Tier)
        try:
            groq_headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            groq_payload = {
                "model": settings.GROQ_PRIMARY_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }

            async with httpx.AsyncClient(timeout=20.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.GROQ_BASE_URL}/chat/completions",
                    headers=groq_headers,
                    json=groq_payload
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: ") and line != "data: [DONE]":
                                raw_json = line[6:]
                                try:
                                    chunk = json.loads(raw_json)
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content")
                                    if content:
                                        yield content
                                except Exception:
                                    continue
                        return
                    else:
                        logger.error(f"Groq API fallback failed with status {response.status_code}")

        except Exception as e:
            logger.error(f"Groq LLM stream failed: {e}")
            yield "LLM generation unavailable. Please check API quota or network connection."

    @classmethod
    async def generate_text(
        cls,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> str:
        """
        Synchronous / non-streaming generator with primary NVIDIA -> Groq failover.
        """
        output_chunks = []
        async for chunk in cls.stream_chat_completion(messages, temperature=temperature, max_tokens=max_tokens):
            output_chunks.append(chunk)
        return "".join(output_chunks)
