// daily-tasks — envia URLs do sitemap ao Google Indexing API diariamente.
// Acionado pelo pg_cron às 16:30 UTC (13:30 BRT).
// Deploy: npx supabase functions deploy daily-tasks --no-verify-jwt --project-ref lymjjozpdsdoloahsyey
//
// ESTRATÉGIA: 
// - A cada execução, busca landing pages hardcoded + grupos visíveis com thumbnail
// - Envia 200 URLs/dia (limite Google Indexing API gratuito)
// - Usa cursor para enviar batches diferentes a cada dia (rotação circular)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_LIMIT = 200; // Limite do Google Indexing API gratuito

// Landing pages — lista completa (80+ rotas)
const LANDING_SLUGS = [
  "/", "/categorias", "/grupos-telegram", "/modelos",
  // === PUTARIA ===
  "/telegram-putaria", "/grupos-putaria-telegram", "/canal-de-putaria",
  "/grupo-putaria-telegram", "/grupos-de-putaria-telegram",
  "/grupo-de-putaria-telegram", "/putaria-telegram", "/xvideos-putaria",
  "/video-porno-telegram", "/porno-gratis-telegram", "/xvideos-porno-telegram",
  "/putaria-brasileira", "/putaria-brasileira-telegram", "/grupos-porno-telegram",
  "/canais-putaria-telegram",
  // === PORNO / XXX ===
  "/telegram-porno", "/telegram-xxx", "/xxx-telegram",
  // === GERAL / 18+ ===
  "/grupos-telegram-18", "/canais-telegram-18", "/telegram-adulto",
  "/grupos-telegram-geral", "/links-telegram", "/telegram-proibido",
  "/grupo-telegram-18", "/grupos-telegram-pode-tudo", "/grupos-telegram-secretos",
  "/grupos-18-telegram", "/grupo-telegram-proibido", "/grupos-telegram",
  // === SEXO ===
  "/telegram-sexo", "/sexo-telegram", "/video-sexo-telegram",
  "/videos-eroticos-telegram", "/chat-sexo-telegram",
  // === NOVINHAS ===
  "/novinhas-telegram", "/mulheres-nuas-telegram", "/vazadinhos-telegram",
  // === VAZADOS ===
  "/vazados-telegram", "/telegram-vazados", "/vazou-telegram", "/vazado-telegram",
  "/grupos-telegram-vazados",
  // === ONLYFANS ===
  "/onlyfans-telegram", "/onlyfans-packs", "/onlyfans-vazados",
  "/telegram-onlyfans", "/michele-umezu-onlyfans",
  // === PRIVACY / EROME ===
  "/privacy-telegram", "/erome-privacy", "/privacy-gratis",
  // === CATEGORIAS ===
  "/amadoras-telegram", "/gay-telegram", "/fetiche-telegram",
  "/casadas-telegram", "/celebridades-telegram", "/asiaticas-telegram",
  "/bdsm-telegram", "/bbw-telegram", "/coroas-telegram",
  // === NOVAS (keyword gap) ===
  "/corno-telegram", "/telegram-corno", "/amador-telegram",
  "/telegram-canais", "/telegram-links", "/telegram-grupo",
  "/grupos-do-telegram", "/telegram-puxadas", "/curso-telegram",
  "/erome-telegram", "/telegram-fap", "/flagras-telegram",
  "/grupos-telegram-br",
];

const BASE_URL = "https://www.canais18.com";

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

function generateSlug(name: string): string {
  let slug = name.toLowerCase();
  slug = slug.replace(/[^\x20-\x7E]/g, "");
  slug = slug.replace(/[\s_]+/g, "-");
  slug = slug.replace(/[^a-z0-9-]/g, "");
  slug = slug.replace(/-+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  slug = slug.slice(0, 60).replace(/-+$/, "");
  return slug;
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (_req) => {
  const sb    = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const today = new Date().toISOString().split("T")[0];
  const now   = new Date().toISOString();

  // Usa o primeiro projeto GCP
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

  // 1. Landing pages (prioridade alta — são as que mais trazem tráfego)
  const landingUrls = LANDING_SLUGS.map(s => `${BASE_URL}${s}`);

  // 2. Grupos visíveis com thumbnail (os que foram liberados pelo auto_release)
  const { data: groups } = await sb
    .from("groups")
    .select("id, name")
    .eq("hidden", false)
    .not("thumbnail_url", "is", null)
    .order("created_at", { ascending: false });

  const groupUrls = (groups || []).map((g: any) => {
    const slug = generateSlug(g.name);
    const compactId = g.id.replace(/-/g, "");
    if (slug) {
      return `${BASE_URL}/group/${slug}-${compactId}`;
    }
    return `${BASE_URL}/group/${compactId}`;
  });

  // Combina: landing pages primeiro (mais importantes), depois grupos
  const allUrls = [...landingUrls, ...groupUrls];
  // Deduplica
  const uniqueUrls = [...new Set(allUrls)];

  // Lê cursor do dia anterior para rotação circular
  const { data: progressData } = await sb
    .from("indexing_progress")
    .select("cursor_offset")
    .eq("project_id", creds.project_id ?? "canais18-indexing")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const cursor = (progressData?.cursor_offset ?? 0) as number;

  // Monta batch do dia (200 URLs a partir do cursor, rotação circular)
  const urlsToSubmit: string[] = [];
  for (let i = 0; i < DAILY_LIMIT && urlsToSubmit.length < DAILY_LIMIT; i++) {
    const idx = (cursor + i) % uniqueUrls.length;
    urlsToSubmit.push(uniqueUrls[idx]);
  }

  // Envia as URLs
  const results: Record<string, "ok" | "quota" | "err"> = {};
  let sent = 0;
  let quotaHit = false;

  for (const url of urlsToSubmit) {
    const res = await submitUrl(token, url);
    results[url] = res;
    if (res === "quota") { quotaHit = true; break; }
    if (res === "ok") sent++;
    await new Promise((r) => setTimeout(r, 100)); // 100ms entre chamadas
  }

  // Atualiza cursor para a próxima execução
  const newCursor = (cursor + urlsToSubmit.length) % uniqueUrls.length;

  // Registra no indexing_progress para o dashboard
  await sb.from("indexing_progress").upsert(
    {
      project_id: creds.project_id ?? "canais18-indexing",
      date: today,
      sent_count: sent,
      total_available: uniqueUrls.length,
      cursor_offset: newCursor,
      sent_urls: urlsToSubmit.slice(0, Math.min(sent, 20)), // só últimas 20 para não lotar
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
      total_urls: urlsToSubmit.length,
      total_available: uniqueUrls.length,
      sent,
      quota_hit: quotaHit,
      cursor: newCursor,
      landing_count: landingUrls.length,
      group_count: groupUrls.length,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
