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
      // 只列出 4 大模組入口
      items: [
        { title: "主線", url: "story/main/index.html", tags: ["章節主線"] },
        { title: "插曲", url: "story/intermezzi/index.html", tags: ["常駐大型活動"] },
        { title: "別傳", url: "story/sidestory/index.html", tags: ["支線活動"] },
        { title: "故事集", url: "story/vignettes/index.html", tags: ["短篇微型故事"] }
      ]
    },
    {
      type: "圖鑑",
      icon: "📚",
      class: "terms",
      items: [
        { title: "泰拉圖鑑百科", url: "handbook/index.html", tags: ["幹員", "名詞設定"] }
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
