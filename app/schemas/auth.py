# app/schemas/auth.py
from pydantic import BaseModel, Field

class UserRegister(BaseModel):
    # 限制用户名 3-20 位
    username: str = Field(..., min_length=3, max_length=20, description="用户名")
    # 限制密码至少 6 位
    password: str = Field(..., min_length=6, description="密码")

class UserLogin(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"