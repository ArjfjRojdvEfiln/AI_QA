import httpx
import json
from config import DIFY_BASE_URL, DIFY_API_KEY

def get_dify_headers():
    """构造 Dify 要求的请求头"""
    return {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }

async def summarize_content(content: str, user_id: str) -> str:
    """
    文章总结（阻塞式：等 Dify 彻底生成完再返回）
    """
    url = f"{DIFY_BASE_URL}/chat-messages"
    payload = {
        "inputs": {},
        "query": f"请为以下内容生成一段精简的摘要总结：\n\n{content}",
        "response_mode": "blocking", # 要求 Dify 整段返回
        "user": str(user_id) # 透传用户ID，便于在 Dify 后台进行审计和限制
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=get_dify_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("answer", "未能生成摘要，请稍后再试。")

async def chat_stream(query: str, user_id: str, conversation_id: str = ""):
    """
    自由问答（流式：打字机效果，拿到一点给前端发一点）
    """
    url = f"{DIFY_BASE_URL}/chat-messages"
    payload = {
        "inputs": {},
        "query": query,
        "response_mode": "streaming", # 要求 Dify 流式输出 (SSE)
        "conversation_id": conversation_id,
        "user": str(user_id)
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        # 使用 astream_post 进行异步流式请求
        async with client.stream("POST", url, headers=get_dify_headers(), json=payload) as response:
            response.raise_for_status()
            # 逐行读取 Dify 返回的 SSE (Server-Sent Events) 数据块
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    # 去掉前缀 "data: "，解析 JSON
                    json_str = line[6:]
                    try:
                        data = json.loads(json_str)
                        # Dify 的流式数据包里，真正的回复文字在 answer 字段中
                        if "answer" in data:
                            yield data["answer"]
                    except json.JSONDecodeError:
                        continue