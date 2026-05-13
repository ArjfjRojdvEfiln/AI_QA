import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI,Request
from app.core.database import engine, Base
import app.models
from app.utils.response import error_response
from app.api import auth
from app.api import knowledge
from app.api import ai
from app.api import user
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行：连接数据库并自动建表
    async with engine.begin() as conn:
        # 如果你想每次启动都删表重建（测试用），可以加上这句：
        # await conn.run_sync(Base.metadata.drop_all)

        # 自动创建所有表
        await conn.run_sync(Base.metadata.create_all)
    print("数据库表结构同步完成！")

    yield

    # 关闭时执行（如果需要清理资源可在此添加）
    print("应用关闭")


app = FastAPI(lifespan=lifespan)
app.include_router(auth.router)
app.include_router(knowledge.router)
app.include_router(ai.router)
app.include_router(user.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有来源跨域
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有请求方法 (GET, POST, PUT, DELETE 等)
    allow_headers=["*"],  # 允许所有请求头
)
# ==========================================
# 💡 全局异常拦截（利用 error_response）
# ==========================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    捕获项目中所有未处理的异常（比如代码写错报错了），
    统一转化成 JSON 格式返回，防止前端直接看到一堆乱码报错。
    """
    print(f"全局异常捕获: {exc}")
    return error_response(msg="服务器开小差了，请稍后再试", code=500, status_code=500)


















