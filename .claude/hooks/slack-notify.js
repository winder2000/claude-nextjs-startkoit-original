#!/usr/bin/env node
// Claude Code 작업 완료 시 Slack 알림 전송

const webhookUrl = process.env.SLACK_WEBHOOK_URL;

if (!webhookUrl) {
  process.exit(0);
}

const payload = JSON.stringify({ text: "✅ Claude Code 작업이 완료되었습니다." });

const url = new URL(webhookUrl);
const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
};

const https = require("https");
const req = https.request(options, () => {});
req.on("error", () => {});
req.write(payload);
req.end();
