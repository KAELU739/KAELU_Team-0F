import { webhookState, setUploadedAvatarUrl, setupWebhookIconUploader } from "./webhookIconManager.js";

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const webhookNameInput = document.getElementById("webhookName");
const saveWebhookSettingsButton = document.getElementById("saveWebhookSettings");
const resetWebhookSettingsButton = document.getElementById("resetWebhookSettings");

const messagesContainer = document.getElementById("messages");

// ===============================
// 二重送信防止フラグ
// ===============================
let isSending = false;


// ===============================
// 初期化
// ===============================
setupWebhookIconUploader();
loadWebhookSettings();
loadMessages();


// ===============================
// メッセージ送信
// ===============================
sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // 改行防止
    sendMessage();
  }
});

async function sendMessage() {
  if (isSending) return;  // ★ 多重送信完全ブロック
  isSending = true;

  const content = messageInput.value.trim();
  if (!content) {
    isSending = false;
    return;
  }

  const settings = loadWebhookSettings();

  const payload = {
    content,
    username: settings.name || "Web User",
    avatar_url: webhookState.avatar || settings.avatar || null
  };

  // ★ UI 側もロック
  sendButton.disabled = true;
  messageInput.disabled = true;

  try {
    await fetch("../api/send-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });


    messageInput.value = "";
  } finally {
    // ★ 送信完了後に解除
    sendButton.disabled = false;
    messageInput.disabled = false;
    isSending = false;
  }
}


// ===============================
// Webhook 設定の保存
// ===============================
saveWebhookSettingsButton.addEventListener("click", () => {
  const name = webhookNameInput.value.trim();
  const current = loadWebhookSettings();

  const settings = {
    name,
    avatar: webhookState.avatar || current.avatar || null
  };

  localStorage.setItem("webhookSettings", JSON.stringify(settings));

  document.getElementById("self-name").textContent = name || "Web User";
  document.getElementById("self-avatar").src =
    webhookState.avatar || "/web-page/asset/default-avatar.png";

  alert("Webhook 設定を保存しました");
});


// ===============================
// Webhook 設定のリセット
// ===============================
resetWebhookSettingsButton.addEventListener("click", () => {
  localStorage.removeItem("webhookSettings");

  setUploadedAvatarUrl(null);
  webhookState.avatar = null;

  webhookNameInput.value = "";
  document.getElementById("self-name").textContent = "Web User";
  document.getElementById("self-avatar").src = "/web-page/asset/default-avatar.png";

  alert("Webhook 設定をリセットしました");
});


// ===============================
// Webhook 設定の読み込み
// ===============================
function loadWebhookSettings() {
  const saved = localStorage.getItem("webhookSettings");
  if (!saved) return {};

  const settings = JSON.parse(saved);

  webhookNameInput.value = settings.name || "";
  document.getElementById("self-name").textContent = settings.name || "Web User";

  if (settings.avatar) {
    document.getElementById("self-avatar").src = settings.avatar;
    setUploadedAvatarUrl(settings.avatar);
    webhookState.avatar = settings.avatar;
  }

  return settings;
}


// ===============================
// メッセージ一覧の読み込み
// ===============================
async function loadMessages() {
  const res = await fetch("../top/message.json");
  const data = await res.json();

  messagesContainer.innerHTML = "";

  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message";

    // ★ スタンプ名（Sticker）
    let stickersHTML = "";
    if (msg.stickers && msg.stickers.length > 0) {
      stickersHTML = `
        <div class="stickers">
          < スタンプ : ${msg.stickers.join(", ")} >
        </div>
      `;
    }

    // ★ 添付ファイル名
    let attachmentsHTML = "";
    if (msg.files && msg.files.length > 0) {
      const fileNames = msg.files.map(f => f.name);
      attachmentsHTML = `
        <div class="attachments">
          < 添付ファイル : ${fileNames.join(", ")} >
        </div>
      `;
    }

    // ★ Discord 風リアクション（emoji + count）
    let reactionsCountHTML = "";
    if (msg.reactionsCount && msg.reactionsCount.length > 0) {
      const parts = msg.reactionsCount.map(r => {
        return `<div class="reaction-btn">${r.emoji} ${r.count}</div>`;
      }).join("");

      reactionsCountHTML = `
        <div class="reactions-count">
          ${parts}
        </div>
      `;
    }

    // ★ スレッド表示
    let threadHTML = "";
    if (msg.isThreadMessage && msg.thread) {
      threadHTML = `
        <div class="thread-info">
          < スレッド : ${msg.thread.threadName} >
        </div>
      `;
    }

    div.innerHTML = `
      <img src="${msg.avatarURL}" class="avatar">
      <div class="content-area">
        <span class="author">${msg.author}</span>
        <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
        <div class="content">${msg.content}</div>

        ${stickersHTML}
        ${attachmentsHTML}
        ${reactionsCountHTML}
        ${threadHTML}
      </div>
    `;

    messagesContainer.appendChild(div);
  });

  scrollToBottom();
}


// ===============================
// スクロールを一番下へ
// ===============================
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


// ===============================
// SSE（リアルタイム更新）
// ===============================
const evt = new EventSource("../events");

evt.onmessage = () => {
  loadMessages();

};
