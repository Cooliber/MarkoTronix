import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # FastAPI settings
    fastapi_host: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    fastapi_port: int = int(os.getenv("FASTAPI_PORT", "8000"))
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your_secret_key_here")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day
    
    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Database
    database_url: str = f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', 'postgres')}@postgres:5432/{os.getenv('POSTGRES_DB', 'hvac_crm')}"
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # MinIO
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "storage:9000")
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    
    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # DocuSign
    docusign_client_id: str = os.getenv("DOCUSIGN_CLIENT_ID", "")
    docusign_secret: str = os.getenv("DOCUSIGN_SECRET", "")
    
    # SMTP
    smtp_host: str = os.getenv("SMTP_HOST", "mailhog")
    smtp_port: int = int(os.getenv("SMTP_PORT", "1025"))
    smtp_user: Optional[str] = os.getenv("SMTP_USER", "")
    smtp_password: Optional[str] = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "noreply@hvac-crm.com")
    
    # Qdrant
    qdrant_url: str = os.getenv("QDRANT_URL", "http://qdrant:6333")
    
    # Twilio
    twilio_account_sid: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_phone_number: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Telegram
    telegram_bot_token: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN", "")
    
    # CORS
    cors_origins: List[str] = ["*"]  # In production, replace with specific origins
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()