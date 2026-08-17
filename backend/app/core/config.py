from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Autergo Recruitment Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "autergo-super-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database Configuration (PostgreSQL by default with SQLite local fallback)
    USE_SQLITE: bool = True
    SQLITE_DB_FILE: str = "autergo_local.db"
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "autergo"
    POSTGRES_PASSWORD: str = "autergo_password"
    POSTGRES_DB: str = "autergo_db"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            # Handle Render/Heroku postgres:// or postgresql:// scheme for asyncpg
            url = self.DATABASE_URL.strip()
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        if self.USE_SQLITE:
            return f"sqlite+aiosqlite:///{self.SQLITE_DB_FILE}"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def SYNC_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        if self.USE_SQLITE:
            return f"sqlite:///{self.SQLITE_DB_FILE}"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        
    # Celery Configuration
    @property
    def CELERY_BROKER_URL(self) -> str:
        return self.REDIS_URL
        
    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return self.REDIS_URL

    # Storage (S3 / MinIO)
    S3_ENDPOINT_URL: Optional[str] = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "autergo-evidence"
    S3_REGION: str = "us-east-1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # LLM Multi-Tier API Configurations
    # 1. NVIDIA API (Primary Provider)
    NVIDIA_API_KEY: str = "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"
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_PRIMARY_MODEL: str = "nvidia/nemotron-3.5-lightning-30b-a3b"
    
    # 2. Groq API (Secondary / Fallback Provider)
    GROQ_API_KEY: str = "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"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_PRIMARY_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FALLBACK_MODEL: str = "gemma2-9b-it"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
