// index.js
import { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "fs";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// あなたの既存処理
import { updateNews } from "./news.js";
import { updateMessage } from "./message.js";

// API ルート
import uploadAvatarRoute from "./uploadAvatar.js";
import sendWebhookRoute from "./send-webhook.js";


// ===============================
// パス解決
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ===============================
// 設定ファイル読み込み
// ===============================
const secret = JSON.parse(fs.readFileSync("../../secret/secret.json", "utf-8"));
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

const TOKEN = secret.token;


// ===============================
// Express API + SSE サーバー起動
// ===============================
const app = express();
app.use(express.json());

// web-page を公開
app.use(express.static(path.join(__dirname, "../../web-page")));

// API ルート
app.use("/api", uploadAvatarRoute);
app.use("/api", sendWebhookRoute);


// ===============================
// ★ SSE（リアルタイム更新）
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


// ===============================
// API サーバー起動
// ===============================
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});


// ===============================
// Discord Bot 起動
// ===============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 起動時にニュース更新
  await updateNews(client);

  // 起動時にメッセージ更新
  await updateMessage(client);

  console.log("🟩 起動処理が完了しました");
});


// ===============================
// メッセージ監視（★ SSE 通知）
// ===============================
client.on("messageCreate", async (message) => {
  await updateMessage(client, message);
  notifyClients();
});

client.on("messageUpdate", async (oldMsg, newMsg) => {
  await updateMessage(client, newMsg);
  notifyClients();
});

client.on("messageDelete", async (message) => {
  await updateMessage(client, message);
  notifyClients();
});


// ===============================
// ニュースチャンネル監視（★ SSE 通知）
// ===============================
client.on("messageCreate", async (message) => {
  await updateNews(client, message);
  notifyClients();
});

client.on("messageUpdate", async (oldMsg, newMsg) => {
  await updateNews(client, newMsg);
  notifyClients();
});

client.on("messageDelete", async (message) => {
  await updateNews(client, message);
  notifyClients();
});


// ===============================
// リアクション監視（★ partial 対応）
// ===============================
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) {
    try { await reaction.fetch(); } catch (e) { return; }
  }

  await updateMessage(client, reaction.message);
  notifyClients();
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.partial) {
    try { await reaction.fetch(); } catch (e) { return; }
  }

  await updateMessage(client, reaction.message);
  notifyClients();
});


// ===============================
// Bot ログイン
// ===============================
client.login(TOKEN);

