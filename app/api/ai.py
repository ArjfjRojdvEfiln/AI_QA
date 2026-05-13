from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.dependencies.auth import get_current_user
from app.schemas.ai import SummarizeRequest, ChatRequest
from app.services import ai_service
from app.utils.response import success, error_response
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/ai", tags=["AI 智能助手模块"])

@router.post("/summarize", summary="文章智能摘要")
async def ai_summarize(
    request: SummarizeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    接收前端传来的文章内容或文章ID，透传给 Dify 生成摘要后完整返回。
    - 如果传入 document_id，则从数据库获取文章内容
    - 如果传入 content，则直接使用该内容
    """
    try:
        content = request.content
        
        if request.document_id:
            content = await ai_service.get_article_content(db, request.document_id)
            if not content:
                return error_response(code=404, msg="文章不存在")
        
        if not content:
            return error_response(code=400, msg="请提供文章内容或文章ID")
        
        summary = await ai_service.summarize_content(content, current_user["username"])
        return success(data={"summary": summary}, msg="摘要生成成功")
    except Exception as e:
        print(f"请求 Dify 异常: {e}")
        return error_response(code=500, msg="AI 服务器开小差了，请稍后再试")

@router.post("/chat", summary="智能自由问答 (流式)")
async def ai_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    接收用户问题，转发至 Dify，并使用 Server-Sent Events (SSE) 持续流式推送到前端。
    """
    return StreamingResponse(
        ai_service.chat_stream(request.query, current_user["username"], request.conversation_id),
        media_type="text/event-stream"
    )