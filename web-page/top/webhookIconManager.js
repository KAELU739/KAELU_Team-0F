// =====================================
// Webhook アイコン管理モジュール（完全版）
// =====================================

// ★ オブジェクトで状態を共有（ESM で確実に参照が共有される）
export const webhookState = {
  avatar: null
};

export function setUploadedAvatarUrl(url) {
  webhookState.avatar = url;
}

// =====================================
// アップローダーのセットアップ
// =====================================
export function setupWebhookIconUploader() {
  const fileInput = document.getElementById("webhookAvatarFile");

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("アップロード結果:", data);

    if (data.cdnUrl) {
      // 内部状態を更新
      setUploadedAvatarUrl(data.cdnUrl);

      // ★ 送信欄のアイコンを更新
      const selfAvatar = document.getElementById("self-avatar");
      if (selfAvatar) selfAvatar.src = data.cdnUrl;

    } else {
      alert("画像のアップロードに失敗しました");
    }
  });
}