from pydantic import BaseModel, Field
from typing import Optional

class SummarizeRequest(BaseModel):
    content: str = Field(..., description="需要总结的文章或笔记内容")

class ChatRequest(BaseModel):
    query: str = Field(..., description="用户的提问内容")
    conversation_id: Optional[str] = Field(default="", description="对话上下文ID，首次提问为空")