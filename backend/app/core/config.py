"""
/app/core/config.py
Application configuration settings.
""" 

from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings."""
    
    PROJECT_NAME: str = "FastAPI PostgreSQL React Template"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], List[AnyHttpUrl]] = []
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str

    # Google API Keys
    GOOGLE_API_KEY: str
    GOOGLE_SEARCH_API_KEY: str
    GOOGLE_CSE_ID: str   # Default CSE ID
    
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings() 