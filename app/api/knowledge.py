# app/api/knowledge.py
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.knowledge import Knowledge
from app.models.category import Category
from app.models.history import History
from app.schemas.knowledge import ArticleCreate, ArticleUpdate
from app.dependencies.auth import get_current_user
from app.utils.response import success, error
from app.utils.pagination import paginate

router = APIRouter(prefix="/api", tags=["Knowledge"])


# ================= 辅助函数：后台异步写记录 =================
async def write_history_task(username: str, knowledge_id: int):
    """
    供 BackgroundTasks 调用的后台任务
    每次查询到文章详情后，在后台静默执行，不阻塞接口返回
    """
    from app.core.database import AsyncSessionLocal
    # 注意：后台任务脱离了主请求的 session，需要重新获取一个独立的 session
    async with AsyncSessionLocal() as session:
        pass
        # 你的 History 插入逻辑写在这里，例如：
        # new_history = History(username=username, knowledge_id=knowledge_id)
        # session.add(new_history)
        # await session.commit()
        # print(f"后台任务：已记录用户 {username} 浏览了文章 {knowledge_id}")


# ================= API 接口 =================

@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """获取所有分类列表"""
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    return success(data=categories)


@router.get("/articles")
async def get_articles(
        category_id: int = Query(None, description="分类ID筛选"),
        page: int = Query(1, ge=1, description="页码"),
        size: int = Query(10, ge=1, le=100, description="每页数量"),
        db: AsyncSession = Depends(get_db)
):
    """获取文章列表（支持分页和分类筛选）"""
    stmt = select(Knowledge).order_by(desc(Knowledge.created_at))

    if category_id:
        stmt = stmt.where(Knowledge.category_id == category_id)

    paginated_data = await paginate(db, stmt, page, size)
    return success(data=paginated_data)


@router.get("/articles/{article_id}")
async def get_article_detail(
        article_id: int,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # 依赖注入：必须携带 Token 才能查看
):
    """获取文章详情（并触发异步写入浏览记录）"""
    result = await db.execute(select(Knowledge).where(Knowledge.id == article_id))
    article = result.scalars().first()

    if not article:
        return error(msg="文章不存在", code=404)

    # 异步触发写历史记录任务：把当前登录的 username 和查出来的 article.title 传过去
    background_tasks.add_task(
        write_history_task,
        username=current_user["username"],
        article_title=article.title
    )

    return success(data=article)


@router.post("/articles")
async def create_article(
        article_in: ArticleCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # 必须登录才能新建
):
    """新增文章/知识点"""
    # 检查分类是否存在
    cat = await db.execute(select(Category).where(Category.id == article_in.category_id))
    if not cat.scalars().first():
        return error(msg="所属分类不存在", code=400)

    new_article = Knowledge(**article_in.model_dump())
    db.add(new_article)
    await db.commit()
    await db.refresh(new_article)

    return success(data=new_article, msg="文章创建成功")


@router.put("/articles/{article_id}")
async def update_article(
        article_id: int,
        article_in: ArticleUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # 必须登录才能修改
):
    """编辑文章"""
    result = await db.execute(select(Knowledge).where(Knowledge.id == article_id))
    article = result.scalars().first()

    if not article:
        return error(msg="文章不存在", code=404)

    # 动态更新传入的字段
    update_data = article_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(article, key, value)

    await db.commit()
    await db.refresh(article)
    return success(data=article, msg="文章更新成功")


@router.delete("/articles/{article_id}")
async def delete_article(
        article_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # 必须登录才能删除
):
    """删除文章"""
    result = await db.execute(select(Knowledge).where(Knowledge.id == article_id))
    article = result.scalars().first()

    if not article:
        return error(msg="文章不存在", code=404)

    await db.delete(article)
    await db.commit()
    return success(msg="文章删除成功")


async def write_history_task(username: str, article_title: str):
    """
    供 BackgroundTasks 调用的后台任务
    每次查询到文章详情后，在后台静默执行，不阻塞接口返回
    """
    from app.core.database import AsyncSessionLocal

    # 注意：后台任务脱离了主请求的生命周期，必须重新获取一个独立的 session
    async with AsyncSessionLocal() as session:
        try:
            # 实例化你的 History 模型，传入 username 和 title
            new_history = History(username=username, title=article_title)
            session.add(new_history)
            await session.commit()
            print(f"✅ 后台任务：成功记录用户 [{username}] 浏览了文章《{article_title}》")
        except Exception as e:
            # 捕获异常，防止后台任务报错导致一些不可预知的问题
            print(f"❌ 后台写入历史记录失败: {e}")