from decouple import config
from typing import Optional

class Settings:
    # Database
    DATABASE_URL: str = config("DATABASE_URL", default="postgresql://user:password@localhost/luminara")
    
    # Redis
    REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379")
    
    # JWT
    SECRET_KEY: str = config("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OAuth
    GITHUB_CLIENT_ID: str = config("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str = config("GITHUB_CLIENT_SECRET")
    DISCORD_CLIENT_ID: str = config("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET: str = config("DISCORD_CLIENT_SECRET")
    
    # Email settings
    SMTP_SERVER: str = config("SMTP_SERVER", default="smtp.gmail.com")
    SMTP_PORT: int = config("SMTP_PORT", default=587, cast=int)
    SMTP_USERNAME: str = config("SMTP_USERNAME")
    SMTP_PASSWORD: str = config("SMTP_PASSWORD")  # App password for Gmail
    FROM_EMAIL: str = config("FROM_EMAIL")
    
    # App settings
    BASE_URL: str = config("BASE_URL", default="https://myluminarasystem.pro")
    
settings = Settings()
