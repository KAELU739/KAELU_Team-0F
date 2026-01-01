// message.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transformMessage, transformThreadAsMessage } from "./transformMessage.js";

// パス解決（絶対パスで安全に）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

export function writeMessageJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  console.log("📄 message.json を更新しました");
}

export async function fetchChannelMessages(client, channelId, savePath) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return;

    const messages = await channel.messages.fetch({ limit: 50 });

    const sorted = [...messages.values()].sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );

    const transformed = sorted.map(m => transformMessage(m));

    writeMessageJSON(savePath, transformed);

  } catch (err) {
    console.error("❌ fetchChannelMessages エラー:", err.message);
  }
}

export function appendThreadToMessages(savePath, thread) {
  const msgData = transformThreadAsMessage(thread);

  let list = [];
  if (fs.existsSync(savePath)) {
    list = JSON.parse(fs.readFileSync(savePath, "utf-8"));
  }

  list.push(msgData);

  fs.writeFileSync(savePath, JSON.stringify(list, null, 2), "utf-8");

  console.log("🧵 スレッドを message.json に追加しました");
}

// ===============================
// ★ index.js が呼び出す updateMessage
// ===============================
export async function updateMessage(client, message) {
  const savePath = path.join(__dirname, "../../web-page/top/message.json");

  const guild = await client.guilds.fetch(config.guildId);
  const channel = await guild.channels.fetch(config.watchChannel);

  if (!channel) {
    console.error("❌ 連携チャットのチャンネルが見つかりません");
    return;
  }

  // スレッドなら append
  if (message?.thread) {
    appendThreadToMessages(savePath, message.thread);
    return;
  }

  // 通常メッセージは fetch し直す
  await fetchChannelMessages(client, config.watchChannel, savePath);
}