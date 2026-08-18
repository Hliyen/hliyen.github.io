(function () {
  // 1. 自動計算根目錄相對路徑
  let depth = 0;
  if (window.location.pathname.includes('/games/')) {
    depth = 2;
  }
  const rootPrefix = depth > 0 ? '../'.repeat(depth) : './';

  // 2. 注入側邊欄組件
  const sidebarHtml = `
    <button id="sidebar-toggle" class="sidebar-toggle-btn" aria-label="開啟導覽">
      ☰
    </button>
    <div id="sidebar-overlay" class="sidebar-overlay"></div>
    <aside id="site-sidebar" class="site-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-logo">🧭 快速導覽</span>
        <button id="sidebar-close" class="sidebar-close-btn">&times;</button>
      </div>
      <nav id="sidebar-nav" class="sidebar-nav">
        <p style="color: var(--ink-soft); font-size: 12px; padding: 10px;">載入目錄中...</p>
      </nav>
    </aside>
  `;
  document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

  // 3. 事件監聽
  const sidebar = document.getElementById('site-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const closeBtn = document.getElementById('sidebar-close');

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  toggleBtn.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // 4. 動態渲染：遊戲區塊 -> 類別區塊 (劇情/時間線) -> 文章連結
  fetch(rootPrefix + 'sidebar.json?v=' + new Date().getTime())
    .then(res => res.json())
    .then(data => {
      const navContainer = document.getElementById('sidebar-nav');
      const currentUrl = window.location.pathname;

      navContainer.innerHTML = data.map(gameBlock => {
        const gameName = gameBlock.game;
        const categories = gameBlock.categories || [];

        const categoriesHtml = categories.map(cat => {
          const linksHtml = cat.pages.map(page => {
            const targetUrl = rootPrefix + page.path;
            const isCurrent = currentUrl.endsWith(page.path) || (page.path === 'index.html' && currentUrl.endsWith('/'));

            return `
              <li>
                <a href="${targetUrl}" class="sidebar-link ${isCurrent ? 'active' : ''}">
                  ${page.title}
                </a>
              </li>
            `;
          }).join('');

          return `
            <div class="sidebar-subgroup">
              <div class="sidebar-category-title">${cat.categoryName}</div>
              <ul class="sidebar-link-list">
                ${linksHtml}
              </ul>
            </div>
          `;
        }).join('');

        return `
          <div class="sidebar-group">
            <div class="sidebar-group-title">${gameName}</div>
            ${categoriesHtml}
          </div>
        `;
      }).join('');
    })
    .catch(err => {
      console.error('側邊欄載入失敗:', err);
      document.getElementById('sidebar-nav').innerHTML = '<p style="font-size:12px;color:var(--coral);padding:10px;">導覽載入失敗</p>';
    });
})();
