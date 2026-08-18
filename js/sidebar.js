(function () {
  // 1. 取得 sidebar.js 自己的絕對路徑，藉此自動鎖定根目錄位置
  // 例如: https://hliyen.github.io/js/sidebar.js -> 根目錄即為 https://hliyen.github.io/
  const currentScript = document.currentScript;
  let rootUrl = './';
  
  if (currentScript && currentScript.src) {
    // 移除結尾的 'js/sidebar.js'，取得網站根路徑
    rootUrl = currentScript.src.replace(/js\/sidebar\.js(\?.*)?$/i, '');
  }

  const jsonUrl = rootUrl + 'sidebar.json?v=' + new Date().getTime();

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

  // 3. 開關事件
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

  // 4. 抓取 sidebar.json 並渲染各層級
  fetch(jsonUrl)
    .then(res => {
      if (!res.ok) {
        throw new Error(`找不到 sidebar.json (HTTP ${res.status})，請求路徑: ${jsonUrl}`);
      }
      return res.json();
    })
    .then(data => {
      const navContainer = document.getElementById('sidebar-nav');
      const currentPath = window.location.pathname;

      navContainer.innerHTML = data.map(gameBlock => {
        const gameName = gameBlock.game;
        const categories = gameBlock.categories || [];

        const categoriesHtml = categories.map(cat => {
          const linksHtml = cat.pages.map(page => {
            const targetUrl = rootUrl + page.path;
            const isCurrent = currentPath.endsWith(page.path) || (page.path === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('/index.html')));

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
      document.getElementById('sidebar-nav').innerHTML = `
        <div style="padding: 12px; font-size: 11px; color: var(--coral);">
          <p style="margin: 0 0 6px; font-weight: 800;">載入失敗</p>
          <p style="margin: 0; color: var(--ink-soft); word-break: break-all;">${err.message}</p>
        </div>
      `;
    });
})();
