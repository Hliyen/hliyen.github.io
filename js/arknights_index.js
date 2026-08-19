// js/arknights_index.js
document.addEventListener('DOMContentLoaded', () => {
  const CATEGORY_CONFIG = [
    {
      type: "時間線",
      icon: "⏳",
      class: "story",
      items: [
        { title: "大地編年時間線", url: "timeline/index.html", tags: ["編年史"] }
      ]
    },
    {
      type: "劇情",
      icon: "📖",
      class: "story",
      items: [
        { title: "主線劇情 (Main Theme)", url: "story/main/index.html", tags: ["章節主線"] },
        { title: "插曲 (Intermezzi)", url: "story/intermezzi/index.html", tags: ["常駐大型活動"] },
        { title: "別傳 (SideStory)", url: "story/sidestory/index.html", tags: ["支線活動"] },
        { title: "故事集 (Vignettes)", url: "story/vignettes/index.html", tags: ["短篇微型故事"] }
      ]
    },
    {
      type: "世界觀",
      icon: "🌍",
      class: "terms",
      items: [
        { title: "世界", url: "worldview/world/index.html", tags: ["泰拉環境"] },
        { title: "國家與地區", url: "worldview/nations/index.html", tags: ["版圖勢力"] },
        { title: "種族", url: "worldview/races/index.html", tags: ["先民/薩卡茲"] },
        { title: "組織", url: "worldview/factions/index.html", tags: ["羅德島/軍政"] },
        { title: "概念", url: "worldview/concepts/index.html", tags: ["源石/源石病"] },
        { title: "物品", url: "worldview/items/index.html", tags: ["科技/聖物"] }
      ]
    }
  ];

  const container = document.getElementById('category-container');
  if (!container) return;

  container.innerHTML = CATEGORY_CONFIG.map(cat => {
    // 內部條目：原始 <ul> <li> 文字列表樣式
    const itemsHtml = cat.items.map(item => {
      const tags = item.tags || [];
      const tagsHtml = tags.map(tag => `<span class="badge">${tag}</span>`).join('');

      return `
        <li class="article-item">
          <a href="${item.url}">${item.title}</a>
          <div class="badge-group">${tagsHtml}</div>
        </li>
      `;
    }).join('');

    // 外層分類卡片：緊湊型卡片排版，標題帶有專屬 icon
    return `
      <div class="compact-game-card category-block ${cat.class}" style="display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
        <h4 style="margin: 0 0 10px; font-size: 14px; font-weight: 800;">
          ${cat.icon} ${cat.type}
        </h4>
        <ul class="article-list" style="margin: 0; padding: 0; flex-grow: 1;">
          ${itemsHtml}
        </ul>
      </div>
    `;
  }).join('');
});
