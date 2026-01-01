// ---------------------------------------------------------
// transformMessage.js
// Discord メッセージ → Web 用 JSON 変換器（完全版）
// ---------------------------------------------------------

export function transformMessage(msg) {
  const guild = msg.guild;

  // ---------------------------------------------------------
  // 1. ニックネーム優先の表示名
  // ---------------------------------------------------------
  const member = guild.members.cache.get(msg.author.id);
  const displayName = member?.nickname || msg.author.username;

  // ---------------------------------------------------------
  // 2. Discord アイコンURL（サイズ64）
  // ---------------------------------------------------------
  const avatarURL = msg.author.displayAvatarURL({ size: 64 });

  // ---------------------------------------------------------
  // 3. メンション変換
  // ---------------------------------------------------------
  let content = msg.content

    // ユーザー <@123> / <@!123>
    .replace(/<@!?(\d+)>/g, (_, id) => {
      const user = guild.members.cache.get(id);
      return user ? `@${user.displayName}` : "@UnknownUser";
    })

    // ロール <@&123>
    .replace(/<@&(\d+)>/g, (_, id) => {
      const role = guild.roles.cache.get(id);
      return role ? `@${role.name}` : "@UnknownRole";
    })

    // チャンネル <#123>
    .replace(/<#(\d+)>/g, (_, id) => {
      const ch = guild.channels.cache.get(id);
      return ch ? `#${ch.name}` : "#UnknownChannel";
    });

  // ---------------------------------------------------------
  // 4. カスタム絵文字 → :emoji_name:
  // ---------------------------------------------------------
  content = content.replace(/<a?:([a-zA-Z0-9_]+):\d+>/g, ":$1:");

  // ---------------------------------------------------------
  // 5. 添付ファイル（★既存コードを保持しつつ拡張）
  // ---------------------------------------------------------
  const files = msg.attachments.map(a => ({
    name: a.name,
    url: a.url,
    markdown: `[${a.name}](${a.url})`
  }));

  // ---------------------------------------------------------
  // 6. リアクション（★既存コードはそのまま残す）
  // ---------------------------------------------------------
  const reactions = msg.reactions.cache.map(r => `:${r.emoji.name}:`);

  const reactionsCount = msg.reactions.cache.map(r => ({
  emoji: r.emoji.name,
  count: r.count
}));


  // ---------------------------------------------------------
  // 7. ★ Discord スタンプ（Sticker）を追加
  // ---------------------------------------------------------
  const stickers = msg.stickers?.map(s => s.name) || [];

  // ---------------------------------------------------------
  // 8. コマンド判定
  // ---------------------------------------------------------
  const isCommand = content.startsWith("/");

  // ---------------------------------------------------------
  // 9. スレッド内メッセージ判定
  // ---------------------------------------------------------
  const isThreadMessage = msg.channel.isThread?.() ?? false;

  const threadInfo = isThreadMessage
    ? {
        threadId: msg.channel.id,
        threadName: msg.channel.name,
        parentId: msg.channel.parentId
      }
    : null;

  // ---------------------------------------------------------
  // 10. 最終 JSON（★追加分を含む）
  // ---------------------------------------------------------
  return {
    id: msg.id,
    author: displayName,
    avatarURL,
    timestamp: msg.createdTimestamp,
    content,

    // 既存
    reactions,
    reactionsCount,
    
    files,
    isCommand,
    isThreadMessage,
    thread: threadInfo,

    // ★追加
    stickers
  };
}

// ---------------------------------------------------------
// スレッド作成を「メッセージとして保存」する変換
// ---------------------------------------------------------
export function transformThreadAsMessage(thread) {
  return {
    id: thread.id,
    author: "スレッド作成",
    avatarURL: "https://cdn.discordapp.com/embed/avatars/1.png",
    timestamp: Date.now(),
    content: `🧵 スレッドが作成されました: ${thread.name}`,
    isThread: true,
    threadId: thread.id,
    threadName: thread.name,
    parentId: thread.parentId
  };
}

