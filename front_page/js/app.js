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

async function loadHistory() {
    const container = document.getElementById('content-container');
    const res = await fetchAPI('/api/user/history?page=1&size=20', { method: 'GET' });
    if (res && res.data) {
        let html = '';
        const list = res.data.items || res.data;
        list.forEach(item => {
            html += `<div class="article-card">
                <div class="article-title">${item.title || '未知文章'}</div>
                <div class="article-meta">浏览时间: ${new Date(item.created_at).toLocaleString()}</div>
            </div>`;
        });
        container.innerHTML = html || '<div style="text-align:center;margin-top:50px;">暂无浏览记录</div>';
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

// app.js 中替换 renderFeedbackForm 函数
function renderFeedbackForm(container) {
    container.innerHTML = `
        <div class="feedback-container">
            <div class="feedback-header">
                <h3>💡 意见反馈与智能助手</h3>
                <p style="font-size: 13px; color: #6b7280;">您的反馈将被 Dify AI 自动分类并优先处理</p>
            </div>
            <div id="feedback-chat-history" class="feedback-chat-box">
                <div class="msg ai">您好！我是系统助手。如果您在使用中遇到问题或有功能建议，请在下方告诉我们。</div>
            </div>
            <div class="feedback-input-area">
                <textarea id="feedback-text" placeholder="请描述您的问题或建议..."></textarea>
                <button class="btn" onclick="submitSmartFeedback()">提交反馈</button>
            </div>
        </div>
    `;
}

// 智能反馈提交逻辑 [cite: 2]
async function submitSmartFeedback() {
    const textarea = document.getElementById('feedback-text');
    const feedback_text = textarea.value.trim();
    const chatHistory = document.getElementById('feedback-chat-history');

    if (!feedback_text) {
        showToast("请输入反馈内容", "error");
        return;
    }

    // 1. 在界面显示用户的输入
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.innerText = feedback_text;
    chatHistory.appendChild(userMsg);
    textarea.value = ''; // 清空输入框

    // 2. 显示 AI 正在思考
    const aiMsg = document.createElement('div');
    aiMsg.className = 'msg ai';
    aiMsg.innerText = "智能助手正在为您分类并处理...";
    chatHistory.appendChild(aiMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 3. 调用后端 Dify 联动接口 [cite: 2]
    const res = await fetchAPI('/api/user/feedback', {
        method: 'POST',
        body: JSON.stringify({ feedback_text })
    });

    if (res && res.data) {
        // 4. 解析并显示 Dify 返回的分类和 AI 回复
        const { category, reply } = res.data;
        aiMsg.innerHTML = `
            <div class="feedback-tag">标签: ${category}</div>
            <div class="feedback-reply">${reply}</div>
        `;
    } else {
        aiMsg.innerText = "抱歉，反馈处理遇到一点问题，我们会人工查看。";
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

document.getElementById('ai-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});

window.onload = checkAuthAndInit;