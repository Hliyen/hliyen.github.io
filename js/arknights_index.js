// js/arknights_index.js
document.addEventListener('DOMContentLoaded', () => {
  const CATEGORY_CONFIG = [
    {
      type: "時間線",
      dir: "timeline/",
      icon: "⏳",
      class: "story"
    },
    {
      type: "劇情",
      icon: "📖",
      class: "story",
      // 劇情下的 4 個模組子資料夾
      subDirs: [
        { name: "主線", dir: "story/main/", icon: "⚔️" },
        { name: "插曲", dir: "story/intermezzi/", icon: "🎭" },
        { name: "別傳", dir: "story/sidestory/", icon: "📜" },
        { name: "故事集", dir: "story/vignettes/", icon: "📑" }
      ]
    },
    {
      type: "圖鑑",
      dir: "handbook/",
      icon: "📚",
      class: "terms",
      targetUrl: "handbook/index.html"
    }
  ];

  // 讀取指定模組資料夾下的 data/manifest.json 與其記錄的整合 json 檔
  async function fetchItemsFromModule(moduleDir) {
    const dataDir = `${moduleDir}data/`;
    try {
      const manifestRes = await fetch(`${dataDir}manifest.json?v=${Date.now()}`);
      if (!manifestRes.ok) return [];

      const fileList = await manifestRes.json();
      if (!Array.isArray(fileList)) return [];

      const promises = fileList.map(async name => {
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

      const nestedItems = await Promise.all(promises);
      // 將路徑補上模組前綴，確保在 index.html 點擊能正確跳轉
      return nestedItems.flat().map(item => ({
        ...item,
        url: item.url ? `${moduleDir}${item.url}` : '#'
      }));
    } catch (e) {
      console.warn(`模組 [${moduleDir}] 載入失敗:`, e);
      return [];
    }
  }

  async function renderAllCategories() {
    const container = document.getElementById('category-container');
    if (!container) return;

    try {
      const renderedBlocks = await Promise.all(CATEGORY_CONFIG.map(async cat => {
        const headerTitle = cat.targetUrl 
          ? `<a href="${cat.targetUrl}" style="color: inherit; text-decoration: none;">${cat.icon} ${cat.type} <span style="font-size: 11px; color: var(--ink-soft);">↗ 前往圖鑑專區</span></a>`
          : `${cat.icon} ${cat.type}`;

        let innerHtml = '';

        // 情況 A：具有多個子模組資料夾（如劇情）
        if (cat.subDirs && Array.isArray(cat.subDirs)) {
          const subResults = await Promise.all(cat.subDirs.map(async sub => {
            const articles = await fetchItemsFromModule(sub.dir);
            return { ...sub, articles };
          }));

          const validSubs = subResults.filter(s => s.articles.length > 0);
          if (validSubs.length === 0) return '';

          innerHtml = validSubs.map(sub => {
            const articlesHtml = sub.articles.map(article => {
              const tags = article.tags || (article.date ? [article.date] : []);
              const tagsHtml = tags.map(t => `<span class="badge">${t}</span>`).join('');
              return `
                <li class="article-item">
                  <a href="${article.url}">${article.title}</a>
                  <div class="badge-group">${tagsHtml}</div>
                </li>
              `;
            }).join('');

            return `
              <div class="sub-category-group" style="margin-bottom: 14px;">
                <div style="font-size: 12px; font-weight: 800; color: #685a96; margin-bottom: 6px; padding-left: 2px;">
                  ${sub.icon} ${sub.name}
                </div>
                <ul class="article-list">
                  ${articlesHtml}
                </ul>
              </div>
            `;
          }).join('');

        } else {
          // 情況 B：單一模組資料夾（如時間線、圖鑑）
          const articles = await fetchItemsFromModule(cat.dir);
          if (articles.length === 0 && !cat.targetUrl) return '';

          const articlesHtml = articles.map(article => {
            const tags = article.tags || (article.date ? [article.date] : []);
            const tagsHtml = tags.map(t => `<span class="badge">${t}</span>`).join('');
            return `
              <li class="article-item">
                <a href="${article.url}">${article.title}</a>
                <div class="badge-group">${tagsHtml}</div>
              </li>
            `;
          }).join('');

          innerHtml = `<ul class="article-list">${articlesHtml || '<li class="article-item"><span style="font-size:12px;color:var(--ink-soft);">尚無文章</span></li>'}</ul>`;
        }

        return `
          <div class="category-block ${cat.class}">
            <h4>${headerTitle}</h4>
            ${innerHtml}
          </div>
        `;
      }));

      const finalHtml = renderedBlocks.filter(Boolean).join('');
      container.innerHTML = finalHtml || '<p style="color: var(--ink-soft);">目前尚無任何文章資料。</p>';

    } catch (err) {
      console.error('目錄載入錯誤:', err);
      container.innerHTML = '<p style="color: var(--coral);">資料載入失敗，請確認檔案路徑與格式。</p>';
    }
  }

  renderAllCategories();
});
