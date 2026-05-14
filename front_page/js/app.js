const API_BASE = "http://127.0.0.1:9991";
let isLoginMode = true;
let sidebarCollapsed = false;
let aiPanelCollapsed = false;
let currentCategoryId = 0;

function showToast(msg, type='success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.style.opacity = 1;
    setTimeout(() => toast.style.opacity = 0, 3000);
}

function showFieldError(fieldId, errorMsg) {
    const errorEl = document.getElementById(fieldId + '-error');
    if (errorEl) {
        errorEl.textContent = errorMsg;
        document.getElementById(fieldId).style.borderColor = '#ef4444';
    }
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById(fieldId + '-error');
    if (errorEl) {
        errorEl.textContent = '';
        document.getElementById(fieldId).style.borderColor = '';
    }
}

function clearAllFieldErrors() {
    clearFieldError('username');
    clearFieldError('password');
    clearFieldError('confirm-password');
}

function validatePassword(password) {
    if (password.length < 6) return '密码长度不能少于6位';
    if (password.length > 20) return '密码长度不能超过20位';
    if (!/[a-zA-Z]/.test(password)) return '密码必须包含字母';
    if (!/[0-9]/.test(password)) return '密码必须包含数字';
    return null;
}

async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (response.status === 401) {
            showToast('登录已过期，请重新登录', 'error');
            logout();
            return null;
        }
        const resData = await response.json();

        if (resData.code && resData.code !== 200) {
            showToast(resData.msg || '请求失败', 'error');
            return null;
        }
        return resData;
    } catch (err) {
        console.error("网络请求错误:", err);
        showToast("网络连接异常，请检查后端服务是否启动", "error");
        return null;
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? '欢迎登录' : '注册新账号';
    document.getElementById('auth-btn').innerText = isLoginMode ? '登 录' : '注 册';
    document.getElementById('auth-switch-text').innerText = isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录';
    document.getElementById('confirm-password-group').style.display = isLoginMode ? 'none' : 'block';
    clearAllFieldErrors();
    document.getElementById('confirm-password').value = '';
}

async function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    clearAllFieldErrors();

    let isValid = true;

    if (!username) {
        showFieldError('username', '请输入用户名');
        isValid = false;
    } else if (username.length < 3 || username.length > 20) {
        showFieldError('username', '用户名长度需在3-20位之间');
        isValid = false;
    }

    if (!password) {
        showFieldError('password', '请输入密码');
        isValid = false;
    } else {
        const pwdError = validatePassword(password);
        if (pwdError) {
            showFieldError('password', pwdError);
            isValid = false;
        }
    }

    if (!isLoginMode) {
        if (!confirmPassword) {
            showFieldError('confirm-password', '请输入确认密码');
            isValid = false;
        } else if (password !== confirmPassword) {
            showFieldError('confirm-password', '两次输入的密码不一致');
            isValid = false;
        }
    }

    if (!isValid) return;

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginMode ? { username, password } : { username, password, confirm_password: confirmPassword };
    const res = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (res && res.code === 200) {
        if (isLoginMode) {
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('username', username);
            showToast("登录成功！");
            checkAuthAndInit();
        } else {
            showToast("注册成功，请登录");
            toggleAuthMode();
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.getElementById('auth-view').style.display = 'flex';
    document.getElementById('main-view').style.display = 'none';
}

function checkAuthAndInit() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('auth-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'flex';
        document.getElementById('current-username').innerText = localStorage.getItem('username');
        loadCategories();
        loadArticles();
    } else {
        document.getElementById('auth-view').style.display = 'flex';
        document.getElementById('main-view').style.display = 'none';
    }
}

function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    const placeholder = document.getElementById('sidebar-placeholder');
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        placeholder.style.display = 'flex';
    } else {
        sidebar.classList.remove('collapsed');
        placeholder.style.display = 'none';
    }
}

function toggleAiPanel() {
    aiPanelCollapsed = !aiPanelCollapsed;
    const aiPanel = document.getElementById('ai-panel');
    const placeholder = document.getElementById('ai-placeholder');
    
    if (aiPanelCollapsed) {
        aiPanel.classList.add('collapsed');
        placeholder.style.display = 'flex';
    } else {
        aiPanel.classList.remove('collapsed');
        placeholder.style.display = 'none';
    }
}

async function loadCategories() {
    const res = await fetchAPI('/api/categories', { method: 'GET' });
    if (res && res.data) {
        const container = document.getElementById('category-filter');
        let html = '<span class="category-tag active" data-category-id="0">全部</span>';
        res.data.forEach(cat => {
            html += `<span class="category-tag" data-category-id="${cat.id}">${cat.name}</span>`;
        });
        container.innerHTML = html;
        
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentCategoryId = parseInt(this.dataset.categoryId);
                loadArticles();
            });
        });
    }
}

function switchTab(tabName, element) {
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    const container = document.getElementById('content-container');
    const headerTitle = document.getElementById('main-header-title');
    const filterBar = document.getElementById('category-filter');

    if (tabName === 'knowledge') {
        headerTitle.innerText = '知识探索';
        filterBar.style.display = 'flex'; // 显示分类过滤
        loadArticles();
    } else if (tabName === 'profile') {
        headerTitle.innerText = '个人中心';
        filterBar.style.display = 'none'; // 隐藏分类过滤
        renderProfilePage(); // 渲染个人中心主页
    }
}

// 核心：渲染个人中心组合页面
async function renderProfilePage() {
    const container = document.getElementById('content-container');
    container.innerHTML = `
        <div class="profile-wrapper">
            <div class="profile-tabs">
                <button class="p-tab active" onclick="switchProfileSubTab('notes', this)">📝 我的笔记</button>
                <button class="p-tab" onclick="switchProfileSubTab('history', this)">🕒 浏览历史</button>
                <button class="p-tab" onclick="switchProfileSubTab('feedback', this)">💡 智能反馈</button>
                <button class="p-tab" onclick="switchProfileSubTab('security', this)">🔒 修改密码</button>
            </div>
            <div id="profile-sub-content" class="profile-sub-content">
                </div>
        </div>
    `;
    // 默认打开第一个子项
    switchProfileSubTab('notes', document.querySelector('.p-tab'));
}

// 切换个人中心内部的子模块
async function switchProfileSubTab(subTab, btn) {
    document.querySelectorAll('.p-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const subContainer = document.getElementById('profile-sub-content');
    subContainer.innerHTML = '加载中...';

    const renderFeedbackForm = (subContainer) => {
    subContainer.innerHTML = `
        <div class="card" style="display: flex; flex-direction: column; height: 500px; margin-top: 10px;">
            <h3 style="margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee;">🤖 智能反馈客服</h3>
            
            <div id="feedback-chat-window" style="flex: 1; overflow-y: auto; background: #fafafa; padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 12px;">
                <div style="align-self: flex-start; background: #e6f7ff; padding: 10px 15px; border-radius: 8px; color: #333; max-width: 80%; line-height: 1.5;">
                    你好！我是系统的专属客服。遇到什么Bug，或者有什么优化建议，都可以告诉我哦！
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: stretch;">
                <textarea id="feedback-input" placeholder="请输入你的反馈（支持多行输入）..." 
                    style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; height: 70px; resize: none; font-family: inherit; font-size: 14px; outline: none; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);"></textarea>
                <button class="btn" onclick="submitFeedback()" 
                    style="width: 100px; height: 70px; flex-shrink: 0; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">发 送</button>
            </div>
        </div>
    `;
};
    if (subTab === 'notes') {
        loadNotes(subContainer);
    } else if (subTab === 'history') {
        loadHistory(subContainer);
    } else if (subTab === 'feedback') {
        renderFeedbackForm(subContainer);
    } else if (subTab === 'security') {
        renderPasswordForm(subContainer);
    }
}

async function loadArticles() {
    const container = document.getElementById('content-container');
    container.innerHTML = '加载中...';

    let url = '/api/articles?page=1&size=20';
    if (currentCategoryId > 0) {
        url += `&category_id=${currentCategoryId}`;
    }

    const res = await fetchAPI(url, { method: 'GET' });
    if (res && res.data) {
        const list = res.data.items || res.data;
        if (list.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#9ca3af;margin-top:50px;">暂无内容，请在后端添加测试数据</div>';
            return;
        }

        let html = '';
        list.forEach(article => {
            html += `
                <div class="article-card" onclick="summarizeArticle(${article.id}, '${article.title}')">
                    <div class="article-title">${article.title}</div>
                    <div class="article-meta">分类 ID: ${article.category_id || '未分类'} </div>
                    <div style="margin-top: 10px; font-size: 14px; color: #4b5563;">
                        ${article.content ? article.content.substring(0, 100) + '...' : '暂无内容简介'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
}
// app.js 中添加 loadNotes 函数实现
async function loadNotes(container) {
    const res = await fetchAPI('/api/user/notes', { method: 'GET' }); // 调用后端接口
    if (res && res.data) {
        const notes = res.data;
        if (notes.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; color:#9ca3af; margin-top:30px;">
                    <p>📭 暂无笔记，在知识库阅读时可以记录哦</p>
                </div>`;
            return;
        }

        let html = '<div class="notes-list">';
        notes.forEach(note => {
            html += `
                <div class="note-card">
                    <div class="note-content">${note.content}</div>
                    <div class="note-actions">
                        <button class="delete-btn" onclick="deleteNote(${note.id}, this)">删除</button>
                    </div>
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }
}

// 补充删除笔记逻辑
async function deleteNote(id, btn) {
    if (!confirm("确定要删除这条笔记吗？")) return;
    const res = await fetchAPI(`/api/user/notes/${id}`, { method: 'DELETE' });
    if (res && res.code === 200) {
        showToast("笔记删除成功");
        btn.closest('.note-card').remove(); // 前端即时移除元素
    }
}

// 替换 app.js 大约第 271 行的 loadHistory 函数
async function loadHistory(container) {
    // 修复一个小Bug：确保渲染在右侧子面板里，而不是覆盖整个页面
    container = container || document.getElementById('profile-sub-content');

    const res = await fetchAPI('/api/user/history?page=1&size=20', { method: 'GET' });
    if (res && res.data) {
        // 在这里加上了“返回知识库”的按钮，并优化了布局
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;"></h3>
                <button class="btn" onclick="switchTab('knowledge', document.querySelector('.menu-item'))" style="background:#6b7280; padding: 6px 12px; font-size: 13px;">⬅ 返回知识库</button>
            </div>
            <div class="history-list">
        `;
        const list = res.data.items || res.data;
        if (list.length === 0) {
            html += '<div style="text-align:center;margin-top:50px;color:#9ca3af;">暂无浏览记录</div>';
        } else {
            list.forEach(item => {
                html += `<div class="article-card" style="margin-bottom: 10px;">
                    <div class="article-title">${item.title || '未知文章'}</div>
                    <div class="article-meta">浏览时间: ${new Date(item.created_at).toLocaleString()}</div>
                </div>`;
            });
        }
        html += '</div>';
        container.innerHTML = html;
    }
}

function appendMessage(role, text) {
    const box = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${role}`;
    msgDiv.innerText = text;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    return msgDiv;
}

async function summarizeArticle(id, title) {
    appendMessage('user', `请帮我总结一下文章：《${title}》`);
    appendMessage('ai', `正在努力阅读并总结文章，请稍等...`);

    const res = await fetchAPI('/api/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ document_id: String(id) })
    });

    if (res && res.data) {
        const msgs = document.querySelectorAll('.msg.ai');
        msgs[msgs.length - 1].innerText = res.data.summary || res.data;
    }
}

async function sendChatMessage() {
    const inputEl = document.getElementById('ai-input');
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputEl.value = '';
    const thinkingMsg = appendMessage('ai', '');
    
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/api/ai/chat`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: text })
        });

        if (!response.ok) {
            thinkingMsg.innerText = '请求失败，请重试';
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            accumulatedText += decoder.decode(value, { stream: true });
            thinkingMsg.innerText = accumulatedText;
        }
        
        if (!thinkingMsg.innerText.trim()) {
            thinkingMsg.innerText = '未获取到响应';
        }
    } catch (error) {
        console.error('流式请求错误:', error);
        thinkingMsg.innerText = '网络连接异常，请检查后端服务';
    }
}

// 渲染修改密码表单
function renderPasswordForm(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 400px; margin: 20px auto;">
            <h3>修改账户密码</h3>
            <div class="input-group">
                <input type="password" id="old-password" placeholder="请输入旧密码">
            </div>
            <div class="input-group">
                <input type="password" id="new-password" placeholder="请输入新密码">
            </div>
            <button class="btn" onclick="submitUpdatePassword()">确认更新</button>
        </div>
    `;
}

// 提交修改密码请求
async function submitUpdatePassword() {
    const old_password = document.getElementById('old-password').value;
    const new_password = document.getElementById('new-password').value;

    if (!old_password || !new_password) {
        showToast("请填写完整内容", "error");
        return;
    }

    const res = await fetchAPI('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password, new_password })
    });

    if (res && res.code === 200) {
        showToast("密码修改成功，请重新登录！");
        setTimeout(() => logout(), 1500); // 强制重新登录
    }
}

// ====== 第二个智能体：客服与智能反馈逻辑 ======
async function submitFeedback() {
    const inputEl = document.getElementById('feedback-input');
    const chatWindow = document.getElementById('feedback-chat-window');
    const text = inputEl.value.trim();

    if (!text) {
        alert("请输入你想反馈的内容！");
        return;
    }

    // 1. 把用户的输入气泡显示在右侧
    chatWindow.innerHTML += `
        <div style="align-self: flex-end; background: #007bff; color: white; padding: 10px 15px; border-radius: 8px; max-width: 80%;">
            ${text}
        </div>`;
    inputEl.value = ''; // 清空输入框

    // 2. 显示 AI 正在思考的提示气泡
    const loadingId = 'loading-' + Date.now();
    chatWindow.innerHTML += `
        <div id="${loadingId}" style="align-self: flex-start; background: #f0f2f5; padding: 10px 15px; border-radius: 8px; color: #666;">
            客服助手正在处理...
        </div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight; // 滚动条自动到底部

    try {
        // 3. 呼叫你的后端 /api/user/feedback 接口
        const res = await fetchAPI('/api/user/feedback', {
    method: 'POST',
    body: JSON.stringify({ feedback_text: text })
});

        // 移除加载气泡
        document.getElementById(loadingId).remove();

        if (res.code === 200) {
            // 4. 提取 AI 返回的内容和打的标签
            const aiReply = res.data.reply || "感谢您的反馈，我们已记录在案！";
            const category = res.data.category || "未分类";

            // 渲染 AI 的回复气泡
            chatWindow.innerHTML += `
                <div style="align-self: flex-start; background: #e6f7ff; padding: 10px 15px; border-radius: 8px; color: #333; max-width: 80%;">
                    <div style="font-size: 12px; color: #888; margin-bottom: 6px;">
                        <span style="border: 1px solid #1890ff; color: #1890ff; padding: 2px 6px; border-radius: 4px;">标签：${category}</span>
                    </div>
                    <div>${aiReply}</div>
                </div>`;
        } else {
            chatWindow.innerHTML += `<div style="align-self: flex-start; color: red; margin: 10px 0;">处理失败: ${res.msg}</div>`;
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        chatWindow.innerHTML += `<div style="align-self: flex-start; color: red; margin: 10px 0;">网络出错了，请检查后端是否开启！</div>`;
    }

    // 保持滚动条在最底部
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

document.getElementById('ai-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});

window.onload = checkAuthAndInit;