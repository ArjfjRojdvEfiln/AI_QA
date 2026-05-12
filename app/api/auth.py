# app/api/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import UserRegister, UserLogin
from app.services import auth_service
from app.core.database import get_db  # 假设你的 database.py 里有获取会话的依赖
from utils.response import success, error  # 引入我们封装好的统一返回

# 路由前缀统一加上 /api/auth
router = APIRouter(prefix="/api/auth", tags=["用户认证"])


@router.post("/register", summary="用户注册")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    user, err_msg = await auth_service.register_user(db, user_data)

    if err_msg:
        # 业务错误，返回统一错误格式
        return error(msg=err_msg)

    # 注册成功，返回脱敏后的数据
    return success(data={"id": user.id, "username": user.username}, msg="注册成功")


@router.post("/login", summary="用户登录")
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    token, err_msg = await auth_service.login_user(db, user_data)

    if err_msg:
        return error(msg=err_msg)

    # 登录成功，返回 Token 供前端后续请求使用
    return success(
        data={"access_token": token, "token_type": "bearer"},
        msg="登录成功"
    )