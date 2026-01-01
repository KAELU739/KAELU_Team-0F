const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// ===============================
// 静的ファイルの公開設定
// ===============================

// web-page 全体を "/" で公開
// → /index.html, /asset/default-avatar.png, /top/app.js などが参照可能
app.use("/", express.static(path.join(__dirname, "../../web-page")));

// top/message.json を配信
app.use("/top", express.static(path.join(__dirname, "../../web-page/top")));


// ===============================
// SSE（リアルタイム更新）
// ===============================
const clients = [];

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write("retry: 1000\n\n");

  clients.push(res);

  req.on("close", () => {
    const i = clients.indexOf(res);
    if (i !== -1) clients.splice(i, 1);
  });
});

function notifyClients() {
  for (const client of clients) {
    client.write("data: update\n\n");
  }
}

module.exports = { notifyClients };

app.listen(8000, () => console.log("Web server running on 8000"));