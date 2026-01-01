async function loadSchedule() {
  try {
    const res = await fetch("schedule.json");
    const data = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時間のズレ対策

    // 未来の予定（今日以降）
    const upcoming = data
      .filter(item => new Date(item.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 終わった予定（今日より前）
    const finished = data
      .filter(item => new Date(item.date) < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // 新しい順

    renderTiles(upcoming, "schedule-list");
    renderTiles(finished, "finished-list");

  } catch (error) {
    console.error("スケジュールの読み込みに失敗しました:", error);
  }
}

/* タイル描画 */
function renderTiles(list, containerId) {
  const container = document.getElementById(containerId);

  list.forEach(item => {
    const tile = document.createElement("div");
    tile.className = "schedule-tile";

    tile.innerHTML = `
      <div class="tile-year">${formatYear(item.date)}</div>
      <div class="tile-date">${formatDate(item.date)}</div>
      <h3 class="tile-title">${item.title}</h3>
      <p class="tile-desc">${item.desc}</p>
    `;

    container.appendChild(tile);
  });
}

/* 年を表示（例：2026年） */
function formatYear(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年`;
}

/* 月日を表示（例：1/12） */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

loadSchedule();

