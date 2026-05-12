from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base



class Knowledge(Base):
    __tablename__ = "knowledges"

    id = Column(Integer, primary_key=True, index=True, comment="主键")
    title = Column(String(255), nullable=False, index=True, comment="文章标题")
    content = Column(Text, nullable=False, comment="文章正文内容")
    category_id = Column(Integer, ForeignKey("categories.id"), comment="所属分类的 ID（外键）")
    source_url = Column(String(500), comment="文章来源链接")

    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="修改时间")