// js/module_loader.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('item-list-container');
  if (!container) return;

  const dataDir = 'data/';
  const manifestUrl = `${dataDir}manifest.json?v=${Date.now()}`;

  fetch(manifestUrl)
    .then(res => {
      if (!res.ok) throw new Error(`讀取 manifest 失敗: ${res.status}`);
      return res.json();
    })
    .then(async fileList => {
      if (!Array.isArray(fileList) || fileList.length === 0) {
        container.innerHTML = '<p style="color: var(--ink-soft); font-size: 13px;">目前尚無資料清單。</p>';
        return;
      }

      const fetchPromises = fileList.map(async name => {
        const fileName = name.endsWith('.json') ? name : `${name}.json`;
        try {
          const res = await fetch(`${dataDir}${fileName}?v=${Date.now()}`);
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : [data];
        } catch (e) {
          console.warn(`讀取 ${dataDir}${fileName} 失敗:`, e);
          return [];
        }
      });

      const nestedItems = await Promise.all(fetchPromises);
      const allItems = nestedItems.flat();

      if (allItems.length === 0) {
        container.innerHTML = '<p style="color: var(--ink-soft); font-size: 13px;">目前尚無項目資料。</p>';
        return;
      }

      // 判斷是否為「國家與地區」類型的結構（帶有 capital / currency 欄位）
      const hasNationInfo = allItems.some(i => i.capital || i.currency);

      if (hasNationInfo) {
        // 渲染為雙欄國家卡片網格（一排兩個）
        const cardsHtml = allItems.map(item => {
          const tags = item.tags || [];
          const tagsHtml = tags.map(t => `<span class="badge badge-mint">${t}</span>`).join('');
          const desc = item.desc ? `<p class="item-desc">${item.desc}</p>` : '';

          return `
            <div class="item-card">
              <div class="item-card-header">
                <h4><a href="${item.url || '#'}" style="color: inherit; text-decoration: none;">${item.title}</a></h4>
                <div class="badge-group">${tagsHtml}</div>
              </div>

              <!-- 國家基礎資訊：首都與貨幣 -->
              <div class="stat-list" style="margin: 6px 0 8px;">
                <div class="stat-row">
                  <span class="stat-name">🏛️ 首都/中樞</span>
                  <span class="stat-value" style="color: var(--ink); font-weight: 700;">${item.capital || '未知/無固定首都'}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-name">🪙 官方貨幣</span>
                  <span class="stat-value" style="color: #a06f52; font-weight: 700;">${item.currency || '未知/多幣種通用'}</span>
                </div>
              </div>

              ${desc}
            </div>
          `;
        }).join('');

        container.className = 'item-grid'; // 套用雙欄排版
        container.innerHTML = cardsHtml;

      } else {
        // 一般文章列表排版
        const itemsHtml = allItems.map(item => {
          const tags = item.tags || [];
          const tagsHtml = tags.map(tag => `<span class="badge">${tag}</span>`).join('');

          return `
            <li class="article-item">
              <a href="${item.url || '#'}">${item.title || item.name || '未命名'}</a>
              <div class="badge-group">${tagsHtml}</div>
            </li>
          `;
        }).join('');

        container.className = 'category-grid';
        container.innerHTML = `
          <div class="category-block story">
            <h4>📖 項目清單</h4>
            <ul class="article-list">
              ${itemsHtml}
            </ul>
          </div>
        `;
      }
    })
    .catch(err => {
      console.error('模組載入錯誤:', err);
      container.innerHTML = `<p style="color: var(--coral);">資料載入失敗，請確認 data/ 內的檔案。</p>`;
    });
});
