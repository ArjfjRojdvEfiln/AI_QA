# 数据库连接
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL

engine = create_async_engine(
DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=3600
)


AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# 所有数据模型类的基类
Base = declarative_base()

async def get_db():
    """获取数据库会话的依赖函数"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
