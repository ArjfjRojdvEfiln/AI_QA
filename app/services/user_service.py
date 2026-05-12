import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.feedback import Feedback
from config import settings

async def process_feedback_via_dify(db: AsyncSession, username: str, feedback_text: str):
    # 1. 封装传给 Dify 工作流的数据
    dify_url = f"{settings.DIFY_BASE_URL}/workflows/run"
    headers = {
        "Authorization": f"Bearer {settings.DIFY_FEEDBACK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": {"feedback_text": feedback_text},
        "response_mode": "blocking",
        "user": username
    }

    # 2. 异步调用 Dify 工作流 API
    async with httpx.AsyncClient() as client:
        response = await client.post(dify_url, headers=headers, json=payload, timeout=30.0)
        response.raise_for_status()
        result = response.json()

    # 3. 解析 Dify 返回的数据（提取分类标签和 AI 回复）
    outputs = result.get("data", {}).get("outputs", {})
    category = outputs.get("category", "系统Bug") # 假设Dify节点输出了对应的键
    ai_reply = outputs.get("reply", "感谢您的反馈，我们会尽快处理！")

    # 4. 将提取的数据存入 Feedback 表，状态设为"待处理"
    new_feedback = Feedback(
        username=username,
        content=feedback_text,
        category=category,
        status="待处理"
    )
    db.add(new_feedback)
    await db.commit()

    # 5. 返回给控制器透传至前端
    return {"category": category, "reply": ai_reply}