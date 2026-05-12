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

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "app", ".env")
        env_file_encoding = "utf-8"


# 实例化配置对象，方便其他模块引入
settings = Settings()

# 兼容旧代码，提供 DATABASE_URL 变量
DATABASE_URL = settings.DATABASE_URL
