import httpx
import json
from config import DIFY_BASE_URL, DIFY_API_KEY, DIFY_FEEDBACK_API_KEY

def get_dify_headers(api_key=None):
    """构造 Dify 要求的请求头"""
    key = api_key or DIFY_API_KEY
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

async def get_article_content(db, document_id: str):
    """
    根据文章ID从数据库获取文章内容
    """
    from app.models.knowledge import Knowledge
    from sqlalchemy import select
    
    try:
        article_id = int(document_id)
        result = await db.execute(select(Knowledge).where(Knowledge.id == article_id))
        article = result.scalars().first()
        
        if article:
            return f"文章标题：{article.title}\n\n文章内容：{article.content}"
        return None
    except Exception as e:
        print(f"获取文章内容失败: {e}")
        return None

async def summarize_content(content: str, user_id: str, api_key: str = None) -> str:
    """
    文章总结（阻塞式：等 Dify 彻底生成完再返回）
    """
    url = f"{DIFY_BASE_URL}/chat-messages"
    payload = {
        "inputs": {},
        "query": f"请为以下内容生成一段精简的摘要总结：\n\n{content}",
        "response_mode": "blocking",
        "user": str(user_id)
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=get_dify_headers(api_key), json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("answer", "未能生成摘要，请稍后再试。")

async def chat_stream(query: str, user_id: str, conversation_id: str = "", api_key: str = None):
    """
    自由问答（流式：打字机效果，拿到一点给前端发一点）
    """
    url = f"{DIFY_BASE_URL}/chat-messages"
    payload = {
        "inputs": {},
        "query": query,
        "response_mode": "streaming",
        "conversation_id": conversation_id,
        "user": str(user_id)
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, headers=get_dify_headers(api_key), json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    json_str = line[6:]
                    try:
                        data = json.loads(json_str)
                        if "answer" in data:
                            # ✅ 必须加上 "data: " 前缀和 "\n\n" 换行符，前端/Yaak 才能解析！
                            yield f"data: {data['answer']}\n\n"
                    except json.JSONDecodeError:
                        continue
