from pydantic import BaseModel, Field
from typing import Optional

class PasswordUpdate(BaseModel):
    old_password: str = Field(..., min_length=6, description="旧密码")
    new_password: str = Field(..., min_length=6, description="新密码")

class FeedbackCreate(BaseModel):
    feedback_text: str = Field(..., description="用户反馈的具体内容")

class NoteCreate(BaseModel):
    study_q: str = Field(..., description="笔记疑问内容")
    related_knowledge_id: Optional[int] = Field(None, description="关联的文章ID")