from app.core.database import Base
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func



class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True, comment="主键")
    username = Column(String(50), index=True, nullable=False, comment="提交人")
    content = Column(Text, nullable=False, comment="反馈的具体内容")
    category = Column(String(50), comment="Dify自动打的标签(如: 系统Bug)")
    status = Column(String(20), default="待处理", comment="状态(待处理/已解决)")

    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="修改时间")