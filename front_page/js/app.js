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

    const titleObj = { 'knowledge': '知识库', 'notes': '我的笔记', 'history': '浏览历史', 'feedback': '智能反馈' };
    document.getElementById('main-header-title').innerText = titleObj[tabName];

    if(tabName === 'knowledge') loadArticles();
    else if(tabName === 'history') loadHistory();
    else document.getElementById('content-container').innerHTML = '<div style="text-align:center;color:#9ca3af;margin-top:50px;">该功能模块前端正在开发中...</div>';
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

document.getElementById('ai-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});

window.onload = checkAuthAndInit;