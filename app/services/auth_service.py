# app/services/auth_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token


async def register_user(db: AsyncSession, user_data: UserRegister):
    """处理用户注册逻辑"""
    # 1. 检查用户名是否已存在
    stmt = select(User).where(User.username == user_data.username)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()

    if existing_user:
        return None, "该用户名已被注册"

    # 2. 密码加密并入库
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, password=hashed_pw)

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)  # 刷新获取自动生成的 id

    return new_user, None


async def login_user(db: AsyncSession, user_data: UserLogin):
    """处理用户登录逻辑"""
    # 1. 根据用户名查库
    stmt = select(User).where(User.username == user_data.username)
    result = await db.execute(stmt)
    user = result.scalars().first()

    # 2. 校验账号是否存在及密码是否正确
    if not user or not verify_password(user_data.password, user.password):
        return None, "用户名或密码错误"

    # 3. 校验通过，签发 JWT Token (有效期 7 天)
    access_token = create_access_token(
        subject={"sub": user.username},
        expires_delta=timedelta(days=7)
    )

    return access_token, None