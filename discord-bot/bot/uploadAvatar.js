// uploadAvatar.js
import express from "express";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer();

// secret.json（Bot トークン）
const secret = JSON.parse(fs.readFileSync("../../secret/secret.json", "utf-8"));
const BOT_TOKEN = secret.token;

// config.json（アップロード先チャンネル ID）
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
const UPLOAD_CHANNEL_ID = config.uploadChannelId;

// ===============================
// 画像アップロード API
// ===============================
router.post("/upload-avatar", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Node.js v25 では FormData / Blob はグローバル
    const form = new FormData();
    form.append("file", new Blob([file.buffer]), file.originalname);

    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${UPLOAD_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`
        },
        body: form
      }
    );

    const json = await discordRes.json();

    if (!json.attachments || json.attachments.length === 0) {
      return res.status(500).json({ error: "Upload failed" });
    }

    const cdnUrl = json.attachments[0].url;

    res.json({ cdnUrl });

  } catch (err) {
    console.error("❌ upload-avatar error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

