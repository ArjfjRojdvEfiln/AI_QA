# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, comment="主键")
    username = Column(String(50), unique=True, index=True, nullable=False, comment="唯一用户名")
    password = Column(String(255), nullable=False, comment="bcrypt加密密码")
    is_active = Column(Boolean, default=True, comment="账户状态")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="修改时间")