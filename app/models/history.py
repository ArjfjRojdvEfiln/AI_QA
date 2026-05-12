from app.core.database import Base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func



class History(Base):
    __tablename__ = "histories"

    id = Column(Integer, primary_key=True, index=True, comment="主键")
    username = Column(String(50), index=True, nullable=False, comment="操作用户名")
    title = Column(String(255), nullable=False, comment="操作对应的文章标题")

    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="修改时间")