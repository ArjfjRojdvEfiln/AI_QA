from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.dependencies.auth import get_current_user
from app.schemas.ai import SummarizeRequest, ChatRequest
from app.services import ai_service
from app.utils.response import success, error_response

router = APIRouter(prefix="/api/ai", tags=["AI 智能助手模块"])

@router.post("/summarize", summary="文章智能摘要")
async def ai_summarize(
    request: SummarizeRequest,
    current_user: dict = Depends(get_current_user)  # 👈 修改1：类型改为 dict
):
    """
    接收前端传来的文章内容，透传给 Dify 生成摘要后完整返回。
    """
    try:
        # 👈 修改2：改用 current_user["username"] 作为传递给 Dify 的用户标识
        summary = await ai_service.summarize_content(request.content, current_user["username"])
        return success(data={"summary": summary}, msg="摘要生成成功")
    except Exception as e:
        print(f"请求 Dify 异常: {e}")
        return error_response(code=500, msg="AI 服务器开小差了，请稍后再试")

@router.post("/chat", summary="智能自由问答 (流式)")
async def ai_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)  # 👈 修改3：类型改为 dict
):
    """
    接收用户问题，转发至 Dify，并使用 Server-Sent Events (SSE) 持续流式推送到前端。
    """
    # 👈 修改4：改用 current_user["username"]
    return StreamingResponse(
        ai_service.chat_stream(request.query, current_user["username"], request.conversation_id),
        media_type="text/event-stream"
    )