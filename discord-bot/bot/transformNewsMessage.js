import fs from "fs";

// ---------------------------------------------------------
// HTML エスケープ（XSS 対策）
// ---------------------------------------------------------
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------
// Discord メッセージ本文 → HTML 変換（完全版）
// ---------------------------------------------------------
function transformDiscordMessage(msg, idMap) {
  // 1. ユーザー入力を先に escape（安全化）
  let text = escapeHtml(msg.content);

  // 2. Markdown（escape 後なので安全）
  text = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // ---------------------------------------------------------
  // 3. メンション変換（escape 後の &lt;...&gt; を対象にする）
  // ---------------------------------------------------------

  // ユーザー
  text = text.replace(/&lt;@!?(\d+)&gt;/g, (match, userId) => {
    const member = msg.guild.members.cache.get(userId);
    if (!member) return "@unknown-user";
    const name = member.nickname || member.user.username;
    return `<a class="mention-user" href="https://discord.com/users/${userId}" target="_blank">@${escapeHtml(name)}</a>`;
  });

  // チャンネル
  text = text.replace(/&lt;#(\d+)&gt;/g, (match, id) => {
    const name = idMap.channels?.[id];
    if (!name) return "#unknown-channel";
    return `<a class="mention-channel" href="https://discord.com/channels/${msg.guild.id}/${id}" target="_blank">#${escapeHtml(name)}</a>`;
  });

  // ロール
  text = text.replace(/&lt;@&amp;(\d+)&gt;/g, (match, id) => {
    const role = idMap.roles?.[id];
    if (!role) return "@unknown-role";
    return `<span class="mention-role" style="color:${role.color}">@${escapeHtml(role.name)}</span>`;
  });

  // 4. 改行
  text = text.replace(/\n/g, "<br>");

  return text;
}

// ---------------------------------------------------------
// 添付ファイル → HTML
// ---------------------------------------------------------
function transformAttachments(msg) {
  let html = "";

  msg.attachments.forEach(att => {
    const url = att.url;
    const name = escapeHtml(att.name);

    const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(url);

    if (isImage) {
      html += `<img src="${url}" class="news-image">`;
    } else {
      html += `<a href="${url}" class="file-link" download>${name} をダウンロード</a>`;
    }
  });

  return html;
}

// ---------------------------------------------------------
// idMap.json の生成（ロールカラー・チャンネル名）
// ---------------------------------------------------------
function generateIdMap(guild) {
  const idMap = {
    channels: {},
    roles: {}
  };

  guild.channels.cache.forEach(ch => {
    idMap.channels[ch.id] = ch.name;
  });

  guild.roles.cache.forEach(role => {
    idMap.roles[role.id] = {
      name: role.name,
      color: "#" + role.color.toString(16).padStart(6, "0")
    };
  });

  // web-page に書き出し
  const outPath = "D:/core-kaelu/web-page/id-map.json";
  fs.writeFileSync(outPath, JSON.stringify(idMap, null, 2));

  return idMap;
}

// ---------------------------------------------------------
// 最新メッセージ → news.json 生成（web-page）
// ---------------------------------------------------------
export async function exportLatestNews(channel) {
  // 最新3件を取得
  const messages = await channel.messages.fetch({ limit: 3 });

  const guild = channel.guild;

  // idMap を生成
  const idMap = generateIdMap(guild);

  // メッセージを新しい順に並べ替え（Discord は古い順で返すことがある）
  const sorted = [...messages.values()].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

  // 3件分を変換
  const dataList = sorted.map(msg => {
    const html = transformDiscordMessage(msg, idMap);
    const attachments = transformAttachments(msg);

    return {
      author: msg.author.username,
      avatar: msg.author.displayAvatarURL(),
      timestamp: msg.createdTimestamp,
      html,
      attachments,
      jumpUrl: msg.url
    };
  });

  // web-page に書き出し
  const outPath = "D:/core-kaelu/web-page/news.json";
  fs.writeFileSync(outPath, JSON.stringify(dataList, null, 2));

  console.log("🟩 最新3件のニュースを web-page/news.json に書き出しました");
}

export {
  transformDiscordMessage,
  transformAttachments,
  generateIdMap
};