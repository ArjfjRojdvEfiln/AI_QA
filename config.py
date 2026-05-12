import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# 加载 .env 文件（指定正确的路径）
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "app", ".env"))


class Settings(BaseSettings):
    # 项目基本信息
    PROJECT_NAME: str = "智能知识库问答系统"

    # JWT 配置
    SECRET_KEY: str = "your-super-secret-key-please-change-it-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # 数据库配置
    DATABASE_URL: str = ""

    # ==========================================
    # Dify 智能体配置区
    # ==========================================
    DIFY_BASE_URL: str = "https://api.dify.ai/v1"

    # 1. 知识库问答/总结智能体 API Key (你原有的)
    DIFY_API_KEY: str = "app-EM9xuEOnLhDw9wOMq5sEqHbc"

    # 2. 用户反馈打标工作流 API Key (新加的)
    DIFY_FEEDBACK_API_KEY: str = "app-wuplxu6kiTfIsqptnu3hZ4i7"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "app", ".env")
        env_file_encoding = "utf-8"


# 实例化配置对象，方便其他模块引入
settings = Settings()

# 兼容旧代码，提供全局变量供外部直接导入 (比如原先的 ai_service.py)
DATABASE_URL = settings.DATABASE_URL
DIFY_BASE_URL = settings.DIFY_BASE_URL
DIFY_API_KEY = settings.DIFY_API_KEY