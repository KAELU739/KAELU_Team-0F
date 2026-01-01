// news.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exportLatestNews } from "./transformNewsMessage.js";

// パス解決（絶対パスで安全に）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON を fs で読み込む（最も安定）
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

export async function updateNews(client) {
  try {
    // ギルド取得
    const guild = await client.guilds.fetch(config.guildId);

    // ニュースチャンネル取得
    const channel = await guild.channels.fetch(config.newsChannelId);

    if (!channel) {
      console.error("❌ ニュースチャンネルが見つかりません");
      return;
    }

    // news.json の絶対パス
    const savePath = path.join(__dirname, "../../web-page", config.newsJsonPath);

    // ニュース更新
    await exportLatestNews(channel, savePath);

    console.log("📰 ニュースを更新しました");

  } catch (err) {
    console.error("❌ ニュース更新エラー:", err.message);
  }
}