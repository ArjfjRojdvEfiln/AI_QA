# app/utils/pagination.py
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

async def paginate(session: AsyncSession, query, page: int, size: int):
    """
    异步分页工具
    :param session: 数据库 session
    :param query: SQLAlchemy 的 select 语句
    :param page: 当前页码
    :param size: 每页数量
    """
    # 1. 查询总条数
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.scalar(count_query)

    # 2. 查询当前页数据
    offset = (page - 1) * size
    paginated_query = query.offset(offset).limit(size)
    result = await session.execute(paginated_query)
    items = result.scalars().all()

    # 3. 返回统一的分页结构
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": items
    }