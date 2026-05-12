from typing import Any, Optional
from fastapi.responses import JSONResponse

def success(data: Any = None, msg: str = "操作成功", code: int = 200) -> dict:
    """
    统一的成功返回格式
    :param data: 返回的具体业务数据
    :param msg: 提示信息
    :param code: 业务状态码 (默认 200)
    """
    return {
        "code": code,
        "data": data,
        "msg": msg
    }

def error(msg: str = "操作失败", code: int = 400, data: Any = None) -> dict:
    """
    统一的失败返回格式
    :param msg: 错误提示信息
    :param code: 业务状态码 (默认 400)
    :param data: 补充的错误数据
    """
    return {
        "code": code,
        "data": data,
        "msg": msg
    }

# 可选：如果遇到异常需要直接中断并返回 JSON，可以封装一个基础的自定义异常响应
def error_response(msg: str = "操作失败", code: int = 400, status_code: int = 400) -> JSONResponse:
    """
    用于直接返回 HTTPException 替代品的 JSONResponse
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "code": code,
            "data": None,
            "msg": msg
        }
    )