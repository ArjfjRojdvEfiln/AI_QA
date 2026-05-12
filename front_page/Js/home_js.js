
        // 简单的路由切换逻辑
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.view-section');
        const pageTitle = document.getElementById('page-title');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // 1. 移除所有 active 状态
                navItems.forEach(n => n.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                // 2. 为当前点击项添加 active
                item.classList.add('active');

                // 3. 动态更新标题
                pageTitle.textContent = item.textContent;

                // 4. 显示对应的 section
                const targetId = item.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
