import os
from dataclasses import dataclass, field
from typing import List
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Settings:
    PROJECT_NAME: str = "RazorFlow AI Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./razorflow.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "razorflow_sec_994827d0a9ef83b8c71d64821a")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_flow_ai_2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "sec_rzp_ai_secret_token_99")
    GMAIL_SENDER: str = os.getenv("GMAIL_SENDER", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    GREEN_API_INSTANCE_ID: str = os.getenv("GREEN_API_INSTANCE_ID", "")
    GREEN_API_TOKEN: str = os.getenv("GREEN_API_TOKEN", "")
    CORS_ORIGINS: List[str] = field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ])

settings = Settings()
