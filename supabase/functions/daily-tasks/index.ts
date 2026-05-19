// daily-tasks — envia as 33 URLs do sitemap ao Google Indexing API diariamente.
// Acionado pelo pg_cron às 16:30 UTC (13:30 BRT).
// Deploy: SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy daily-tasks --no-verify-jwt --project-ref lymjjozpdsdoloahsyey

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Exatas 33 URLs do sitemap (8 estáticas + 25 categorias)
const SITEMAP_URLS = [
  // Estáticas
  "https://www.canais18.com/",
  "https://www.canais18.com/categorias",
  "https://www.canais18.com/grupos-telegram",
  "https://www.canais18.com/blog",
  "https://www.canais18.com/contato",
  "https://www.canais18.com/submit",
  "https://www.canais18.com/privacy",
  "https://www.canais18.com/terms",
  // Categorias
  "https://www.canais18.com/telegram-putaria",
  "https://www.canais18.com/grupos-putaria-telegram",
  "https://www.canais18.com/telegram-porno",
  "https://www.canais18.com/telegram-xxx",
  "https://www.canais18.com/grupos-telegram-18",
  "https://www.canais18.com/novinhas-telegram",
  "https://www.canais18.com/vazados-telegram",
  "https://www.canais18.com/onlyfans-telegram",
  "https://www.canais18.com/canal-de-putaria",
  "https://www.canais18.com/grupo-putaria-telegram",
  "https://www.canais18.com/xxx-telegram",
  "https://www.canais18.com/grupos-porno-telegram",
  "https://www.canais18.com/canais-putaria-telegram",
  "https://www.canais18.com/canais-telegram-18",
  "https://www.canais18.com/telegram-adulto",
  "https://www.canais18.com/grupos-telegram-geral",
  "https://www.canais18.com/amadoras-telegram",
  "https://www.canais18.com/gay-telegram",
  "https://www.canais18.com/fetiche-telegram",
  "https://www.canais18.com/casadas-telegram",
  "https://www.canais18.com/celebridades-telegram",
  "https://www.canais18.com/asiaticas-telegram",
  "https://www.canais18.com/bdsm-telegram",
  "https://www.canais18.com/bbw-telegram",
  "https://www.canais18.com/coroas-telegram",
];

// ── Google OAuth2 (JWT RS256) ─────────────────────────────────────────────────

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getGoogleToken(creds: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const b64u = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const header  = b64u({ alg: "RS256", typ: "JWT" });
  const payload = b64u({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const sigInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(creds.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(sigInput));
  const jwt = `${sigInput}.${btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(JSON.stringify(d).slice(0, 120));
  return d.access_token;
}

async function submitUrl(
  token: string,
  url: string
): Promise<"ok" | "quota" | "err"> {
  const r = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });
  if (r.status === 429) return "quota";
  return r.ok ? "ok" : "err";
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (_req) => {
  const sb    = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const today = new Date().toISOString().split("T")[0];
  const now   = new Date().toISOString();

  // Usa apenas o primeiro projeto GCP — 33 URLs cabem folgado no limite diário de 200
  const credsJson = Deno.env.get("GOOGLE_CREDS_1");
  if (!credsJson) {
    return new Response(JSON.stringify({ ok: false, error: "GOOGLE_CREDS_1 not set" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  let creds: Record<string, string>;
  try {
    creds = JSON.parse(credsJson);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "GOOGLE_CREDS_1 invalid JSON" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  let token: string;
  try {
    token = await getGoogleToken(creds);
  } catch (e) {
    const msg = `oauth_error: ${(e as Error).message.slice(0, 80)}`;
    await sb.from("seo_health").upsert(
      { task: "daily-tasks", last_run: now, last_error: msg, status: "error" },
      { onConflict: "task" }
    );
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  // Envia todas as 33 URLs — sem cursor, sem bulk, sem paginação
  const results: Record<string, "ok" | "quota" | "err"> = {};
  let sent = 0;
  let quotaHit = false;

  for (const url of SITEMAP_URLS) {
    const res = await submitUrl(token, url);
    results[url] = res;
    if (res === "quota") { quotaHit = true; break; }
    if (res === "ok") sent++;
    await new Promise((r) => setTimeout(r, 100)); // 100ms entre chamadas
  }

  // Registra no indexing_progress para o dashboard
  await sb.from("indexing_progress").upsert(
    {
      project_id: creds.project_id ?? "canais18-indexing",
      date: today,
      sent_count: sent,
      sent_urls: SITEMAP_URLS.slice(0, sent),
    },
    { onConflict: "project_id,date" }
  );

  // Atualiza seo_health
  await sb.from("seo_health").upsert(
    {
      task: "daily-tasks",
      last_run: now,
      last_success: now,
      last_error: null,
      status: "ok",
    },
    { onConflict: "task" }
  );

  return new Response(
    JSON.stringify({
      ok: true,
      today,
      total_urls: SITEMAP_URLS.length,
      sent,
      quota_hit: quotaHit,
      results,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
