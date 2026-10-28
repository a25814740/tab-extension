import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const RETURN_URL = Deno.env.get("PAYUNI_RETURN_URL") ?? "";
const RETURN_DESTINATION = Deno.env.get("PAYUNI_RETURN_DESTINATION") ?? "";
const CREATOR_PORTAL_URL = Deno.env.get("CREATOR_PORTAL_URL") ?? "https://tab-extension-gamma.vercel.app/creator/#/";

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (["success", "paid", "completed", "succeeded"].includes(normalized)) {
    return { title: "付款已送出", tone: "success", detail: "如果這筆交易成功入帳，主題權限通常會在幾秒內更新。" };
  }
  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return { title: "付款未完成", tone: "error", detail: "可以回到 Taboard 重新嘗試，先別急著懷疑人生。" };
  }
  return { title: "已收到付款回流", tone: "info", detail: "目前先顯示回流結果，實際權限仍以 webhook 與資料庫狀態為準。" };
}

serve((req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const status = (url.searchParams.get("Status") ?? url.searchParams.get("status") ?? "").trim();
  const orderId =
    (url.searchParams.get("MerTradeNo") ??
      url.searchParams.get("merchant_order_no") ??
      url.searchParams.get("order_id") ??
      "").trim();
  const providerTradeNo =
    (url.searchParams.get("TradeNo") ?? url.searchParams.get("trade_no") ?? url.searchParams.get("PayUniTradeNo") ?? "").trim();
  const destination = (RETURN_DESTINATION || CREATOR_PORTAL_URL || "").trim();

  if (destination && destination !== RETURN_URL && destination !== req.url) {
    const redirectTarget = new URL(destination);
    if (status) {
      redirectTarget.searchParams.set("payuni_status", status);
    }
    if (orderId) {
      redirectTarget.searchParams.set("payuni_order", orderId);
    }
    if (providerTradeNo) {
      redirectTarget.searchParams.set("payuni_trade", providerTradeNo);
    }
    return Response.redirect(redirectTarget.toString(), 302);
  }

  const resolved = resolveStatusLabel(status || "unknown");
  const toneClass =
    resolved.tone === "success"
      ? "#10b981"
      : resolved.tone === "error"
        ? "#f43f5e"
        : "#38bdf8";

  return html(`<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Taboard 付款回流</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(244,63,94,.18), transparent 30%),
          linear-gradient(180deg, #0b1222 0%, #111827 100%);
        color: #e2e8f0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 24px;
      }
      .card {
        width: min(100%, 560px);
        border-radius: 28px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.92);
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.45);
        padding: 28px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.06);
        color: #cbd5e1;
        font-size: 12px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: ${toneClass};
        box-shadow: 0 0 24px ${toneClass};
      }
      h1 {
        margin: 18px 0 10px;
        font-size: 28px;
        line-height: 1.15;
      }
      p {
        margin: 0;
        color: #94a3b8;
        font-size: 14px;
        line-height: 1.7;
      }
      .meta {
        margin-top: 18px;
        display: grid;
        gap: 10px;
      }
      .meta-item {
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.12);
        background: rgba(15, 23, 42, 0.68);
        padding: 12px 14px;
      }
      .meta-label {
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: .12em;
      }
      .meta-value {
        margin-top: 6px;
        font-size: 14px;
        color: #e2e8f0;
        word-break: break-all;
      }
      .actions {
        margin-top: 22px;
        display: grid;
        gap: 10px;
      }
      .btn {
        appearance: none;
        border: 0;
        border-radius: 16px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        cursor: pointer;
      }
      .btn-primary {
        background: #f43f5e;
        color: white;
      }
      .btn-secondary {
        background: transparent;
        color: #e2e8f0;
        border: 1px solid rgba(148, 163, 184, 0.22);
      }
      .hint {
        margin-top: 14px;
        font-size: 12px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="badge"><span class="dot"></span> PAYUNi Return</div>
      <h1>${escapeHtml(resolved.title)}</h1>
      <p>${escapeHtml(resolved.detail)}</p>

      <section class="meta">
        <div class="meta-item">
          <div class="meta-label">付款狀態</div>
          <div class="meta-value">${escapeHtml(status || "unknown")}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">平台訂單編號</div>
          <div class="meta-value">${escapeHtml(orderId || "尚未提供")}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">金流交易編號</div>
          <div class="meta-value">${escapeHtml(providerTradeNo || "尚未提供")}</div>
        </div>
      </section>

      <div class="actions">
        <a class="btn btn-primary" href="${escapeHtml(CREATOR_PORTAL_URL)}">回到 Creator 後台</a>
        <button class="btn btn-secondary" id="closeBtn" type="button">關閉此視窗</button>
      </div>

      <div class="hint">如果你是從彈出視窗付款，關掉這頁後回到 Taboard 重新打開主題商店，權限通常就會更新。</div>
    </main>
    <script>
      const closeBtn = document.getElementById("closeBtn");
      closeBtn?.addEventListener("click", () => {
        window.close();
      });
    </script>
  </body>
</html>`);
});
