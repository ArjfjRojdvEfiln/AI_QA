# app/schemas/knowledge.py
from pydantic import BaseModel, HttpUrl
from typing import Optional

class ArticleCreate(BaseModel):
    title: str
    content: str
    category_id: int
    source_url: Optional[str] = None

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    source_url: Optional[str] = None