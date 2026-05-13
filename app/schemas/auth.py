# app/schemas/auth.py
from pydantic import BaseModel, Field, validator
import re

class UserRegister(BaseModel):
    # 限制用户名 3-20 位
    username: str = Field(..., min_length=3, max_length=20, description="用户名")
    # 限制密码 6-20 位，必须包含字母和数字
    password: str = Field(..., min_length=6, max_length=20, description="密码（6-20位，必须包含字母和数字）")
    # 确认密码
    confirm_password: str = Field(..., description="确认密码")

    @validator('password')
    def validate_password_complexity(cls, v):
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('密码必须包含字母')
        if not re.search(r'[0-9]', v):
            raise ValueError('密码必须包含数字')
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('两次输入的密码不一致')
        return v

class UserLogin(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"