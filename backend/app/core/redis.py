import redis.asyncio as aioredis
from typing import Optional
from app.core.config import settings

redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=50
)

async def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=redis_pool)

class RedisHelper:
    @staticmethod
    async def set_cache(key: str, value: str, expire_seconds: Optional[int] = None):
        r = await get_redis()
        await r.set(key, value, ex=expire_seconds)

    @staticmethod
    async def get_cache(key: str) -> Optional[str]:
        r = await get_redis()
        return await r.get(key)

    @staticmethod
    async def delete_cache(key: str):
        r = await get_redis()
        await r.delete(key)
