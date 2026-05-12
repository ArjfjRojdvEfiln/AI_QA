from .user import User
from .category import Category
from .knowledge import Knowledge
from .history import History
from .notes import StudyNote
from .feedback import Feedback

# 方便外部直接 import models，从而注册所有的表结构到 Base.metadata 中