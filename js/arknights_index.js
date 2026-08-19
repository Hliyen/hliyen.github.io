// js/arknights_index.js
document.addEventListener('DOMContentLoaded', () => {
  const CATEGORY_CONFIG = [
    {
      type: "時間線",
      icon: "⏳",
      class: "story",
      items: [
        { title: "時間線", url: "timeline/index.html", tags: ["時間線"] }
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
        { title: "故事集 (Vignettes)", url: "story/vignettes/index.html", tags: ["短篇故事"] }
      ]
    },
    {
      type: "世界觀",
      icon: "🌍",
      class: "terms",
      items: [
        { title: "世界", url: "worldview/world/index.html", tags: ["泰拉"] },
        { title: "國家與地區", url: "worldview/nations/index.html", tags: ["國家"] },
        { title: "種族", url: "worldview/races/index.html", tags: ["種族"] },
        { title: "組織", url: "worldview/factions/index.html", tags: ["組織"] },
        { title: "概念", url: "worldview/concepts/index.html", tags: ["概念"] },
        { title: "物品", url: "worldview/items/index.html", tags: ["物品"] }
      ]
    }
  ];

  const container = document.getElementById('category-container');
  if (!container) return;

  container.innerHTML = CATEGORY_CONFIG.map(cat => {
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

    return `
      <div class="category-block ${cat.class}">
        <h4>${cat.icon} ${cat.type}</h4>
        <ul class="article-list">
          ${itemsHtml}
        </ul>
      </div>
    `;
  }).join('');
});
