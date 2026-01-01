// send-webhook.js
import express from "express";
import fs from "fs";

const router = express.Router();

// secret.json（メッセージ送信用 Webhook URL）
const secret = JSON.parse(fs.readFileSync("../../secret/secret.json", "utf-8"));
const WEBHOOK_URL = secret.webhooks.message;

// ===============================
// Webhook 送信 API
// ===============================
router.post("/send-webhook", async (req, res) => {
  try {
    const { content, username, avatar_url } = req.body;

    // Discord に送る payload
    const payload = {
      content,
      username,
      avatar_url
    };

    const discordRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      console.error("❌ Discord Webhook Error:", await discordRes.text());
      return res.status(500).json({ error: "Webhook send failed" });
    }

    res.json({ ok: true });

  } catch (err) {
    console.error("❌ send-webhook error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;