# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from passlib.context import CryptContext
from config import settings

# 1. 初始化密码哈希上下文，指定使用 bcrypt 算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """
    将明文密码转换为 bcrypt 哈希值，用于注册时存入数据库
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    校验明文密码与数据库中的哈希值是否匹配，用于登录验证
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    生成 JWT 访问令牌
    :param subject: 通常传入用户的 ID 或 username
    :param expires_delta: 自定义过期时间
    """
    # 如果没有指定过期时间，则使用 config.py 中配置的 7 天
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # JWT 的载荷 (Payload)
    # 'exp' 是保留字段，代表过期时间
    # 'sub' 是保留字段，代表主题 (这里我们存放用户名)
    to_encode = {"exp": expire, "sub": str(subject)}

    # 使用 SECRET_KEY 和指定的算法生成 JWT 字符串
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt