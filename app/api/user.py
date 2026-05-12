from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.utils.response import success, error
from app.schemas.user import PasswordUpdate, FeedbackCreate, NoteCreate
from app.services import user_service
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.models.history import History
from app.models.notes import StudyNote

router = APIRouter(prefix="/api/user", tags=["个人中心模块"])

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """展示用户的基本账户信息"""
    return success(data={"username": current_user["username"]}, msg="获取用户信息成功")

@router.put("/password")
async def update_password(
    data: PasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """修改密码：验证旧密码，加密新密码后更新"""
    result = await db.execute(select(User).where(User.username == current_user["username"]))
    user = result.scalars().first()

    if not verify_password(data.old_password, user.hashed_password):
        return error(msg="旧密码错误", code=400)

    user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return success(msg="密码修改成功，请重新登录")

@router.get("/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取并展示当前用户的过往文章浏览记录（按时间倒序排列）"""
    result = await db.execute(
        select(History)
        .where(History.username == current_user["username"])
        .order_by(History.created_at.desc())
    )
    histories = result.scalars().all()
    return success(data=[{"title": h.title, "viewed_at": h.created_at} for h in histories])

@router.post("/feedback")
async def submit_feedback(
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """调用Dify反馈工作流 -> 分类打标签 -> 存Feedback表 -> 返回AI回复"""
    try:
        result = await user_service.process_feedback_via_dify(
            db=db,
            username=current_user["username"],
            feedback_text=data.feedback_text
        )
        return success(data=result, msg="反馈提交成功")
    except Exception as e:
        return error(msg=f"智能反馈处理失败: {str(e)}", code=500)

@router.post("/notes")
async def create_note(
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建学习笔记（存StudyNotes表）"""
    new_note = StudyNote(
        username=current_user["username"],
        study_q=data.study_q
    )
    db.add(new_note)
    await db.commit()
    return success(msg="笔记创建成功")

@router.get("/notes")
async def get_notes(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """查询当前用户的笔记列表"""
    result = await db.execute(select(StudyNote).where(StudyNote.username == current_user["username"]))
    notes = result.scalars().all()
    return success(data=[{"id": n.id, "content": n.study_q} for n in notes])