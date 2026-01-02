function loadNews() {
  return fetch("news.json")
    .then(res => res.json())
    .catch(() => []);
}

loadNews().then(newsList => {
  const container = document.getElementById("news-container");

  if (!newsList || newsList.length === 0) {
    container.innerHTML = "<p>ニュースがありません。</p>";
    return;
  }

  newsList.forEach(item => {
    const tile = document.createElement("div");
    tile.className = "news-tile";

    tile.innerHTML = `
      <div class="news-avatar-area">
        <img src="${item.avatar}" class="avatar">
      </div>

      <div class="news-body">
        <div class="news-body-header">
          <div class="author">${item.author}</div>
          <div class="date">${new Date(item.timestamp).toLocaleString()}</div>
        </div>

        <div class="news-content">
          ${item.html}
        </div>

        <div class="news-attachments">
          ${item.attachments || ""}
        </div>

        <div class="news-footer">
          <a href="${item.jumpUrl}" target="_blank" rel="noopener noreferrer">
            元メッセージを見る
          </a>
        </div>
      </div>
    `;

    container.appendChild(tile);
  });
});
