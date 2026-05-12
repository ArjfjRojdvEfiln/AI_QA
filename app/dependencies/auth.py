# app/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from config import settings
from app.utils.response import error

# 声明 Token 的获取位置（通常在 Header 的 Authorization: Bearer <token>）
# tokenUrl 是告诉 Swagger UI 你的登录接口在哪，方便网页上直接测试
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    解析 Token 并获取当前用户。
    如果 Token 无效或过期，直接抛出异常拦截请求。
    """
    try:
        # 解码 JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token 无效")

        # 这里你可以根据 username 去数据库查完整的 User 对象
        # 为了简单且不频繁查库，目前我们先直接返回一个包含用户信息的字典
        return {"username": username}

    except JWTError:
        raise HTTPException(status_code=401, detail="Token 已过期或不合法，请重新登录")