// js/module_loader.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('item-list-container');
  if (!container) return;

  const dataDir = 'data/';
  const manifestUrl = `${dataDir}manifest.json?v=${Date.now()}`;

  // 1. 讀取 data/manifest.json
  fetch(manifestUrl)
    .then(res => {
      if (!res.ok) throw new Error(`讀取 data/manifest.json 失敗 (HTTP ${res.status})`);
      return res.json();
    })
    .then(async fileList => {
      if (!Array.isArray(fileList) || fileList.length === 0) {
        container.innerHTML = '<p style="color: var(--ink-soft); font-size: 13px;">目前尚無資料清單。</p>';
        return;
      }

      // 2. 讀取清單中記錄的整合 JSON 檔（如 chapters.json）
      const fetchPromises = fileList.map(async name => {
        const fileName = name.endsWith('.json') ? name : `${name}.json`;
        try {
          const res = await fetch(`${dataDir}${fileName}?v=${Date.now()}`);
          if (!res.ok) return [];
          const data = await res.json();
          // 如果內部是陣列則返回，單一物件則轉為陣列
          return Array.isArray(data) ? data : [data];
        } catch (e) {
          console.warn(`讀取 ${dataDir}${fileName} 失敗:`, e);
          return [];
        }
      });

      const nestedItems = await Promise.all(fetchPromises);
      // 將所有整合檔內的項目合併為單一陣列
      const allItems = nestedItems.flat();

      if (allItems.length === 0) {
        container.innerHTML = '<p style="color: var(--ink-soft); font-size: 13px;">目前尚無項目資料。</p>';
        return;
      }

      // 3. 渲染項目卡片列表
      const itemsHtml = allItems.map(item => {
        const tags = item.tags || (item.date ? [item.date] : []);
        const tagsHtml = tags.map(tag => `<span class="badge">${tag}</span>`).join('');
        const itemUrl = item.url || '#';
        const itemTitle = item.title || item.name || '未命名項目';

        return `
          <li class="article-item">
            <a href="${itemUrl}">${itemTitle}</a>
            <div class="badge-group">${tagsHtml}</div>
          </li>
        `;
      }).join('');

      container.innerHTML = `
        <div class="category-block story">
          <h4>📖 章節列表</h4>
          <ul class="article-list">
            ${itemsHtml}
          </ul>
        </div>
      `;
    })
    .catch(err => {
      console.error('載入失敗:', err);
      container.innerHTML = `<p style="color: var(--coral); font-size: 13px;">資料載入失敗，請確認 data/ 內的檔案與路徑。</p>`;
    });
});
