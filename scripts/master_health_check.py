"""
master_health_check.py — Validação diária completa do canais18.com
Roda via GitHub Actions às 18h UTC (15h BRT).
Verifica: SSR/Googlebot, Sitemap, GSC cache, Cloudflare Workers, Supabase, Canonicals.
Exit code 1 se houver falha crítica (GitHub Actions marca o run como falho).
"""

import os, sys, re, time, json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

import requests
from dotenv import load_dotenv

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build as gapi_build
    _HAS_GOOGLE = True
except ImportError:
    _HAS_GOOGLE = False

load_dotenv()

# ── Configuração ──────────────────────────────────────────────────────────────

SUPABASE_URL     = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY     = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_MGMT    = os.getenv("SUPABASE_ACCESS_TOKEN", "")
CF_TOKEN         = os.getenv("CLOUDFLARE_API_TOKEN", "")
RESEND_KEY       = os.getenv("RESEND_API_KEY", "")
EMAIL_TO         = os.getenv("EMAIL_DESTINO", "tggrupos@proton.me")
SUPABASE_REF     = "lymjjozpdsdoloahsyey"
GITHUB_TOKEN     = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO      = "us3rmax/tele-gem-hub"

BASE             = "https://www.canais18.com"
SITEMAP_URL      = f"{BASE}/sitemap.xml"
GOOGLEBOT_UA     = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

STATIC_SLUGS = {
    "", "categorias", "grupos-telegram", "blog",
    "contato", "submit", "privacy", "terms",
}

CATEGORY_SLUGS = {
    "telegram-putaria", "grupos-putaria-telegram", "telegram-porno", "telegram-xxx",
    "grupos-telegram-18", "novinhas-telegram", "vazados-telegram", "onlyfans-telegram",
    "canal-de-putaria", "grupo-putaria-telegram", "xxx-telegram", "grupos-porno-telegram",
    "canais-putaria-telegram", "canais-telegram-18", "telegram-adulto",
    "grupos-telegram-geral", "amadoras-telegram", "gay-telegram", "fetiche-telegram",
    "casadas-telegram", "celebridades-telegram", "asiaticas-telegram",
    "bdsm-telegram", "bbw-telegram", "coroas-telegram",
}

SITEMAP_URLS = (
    [f"{BASE}/"]
    + [f"{BASE}/{s}" for s in sorted(STATIC_SLUGS) if s]
    + [f"{BASE}/{s}" for s in sorted(CATEGORY_SLUGS)]
)
assert len(SITEMAP_URLS) > 0, f"Sitemap vazio — nenhuma URL encontrada"

# ── Result model ──────────────────────────────────────────────────────────────

Status = Literal["ok", "warn", "fail"]

@dataclass
class Check:
    name:     str
    status:   Status
    message:  str
    critical: bool       = False
    details:  list[str]  = field(default_factory=list)

_results: list[Check] = []

def _add(c: Check) -> Check:
    _results.append(c)
    icon = {"ok": "[OK]", "warn": "[WN]", "fail": "[!!]"}[c.status]
    print(f"  {icon} {c.name}: {c.message}")
    for d in c.details[:3]:
        print(f"       > {d}")
    return c

def ok(name, msg, **kw):   return _add(Check(name, "ok",   msg, **kw))
def warn(name, msg, **kw): return _add(Check(name, "warn", msg, **kw))
def fail(name, msg, critical=True, **kw): return _add(Check(name, "fail", msg, critical=critical, **kw))

# ── Supabase REST helper ──────────────────────────────────────────────────────

_SB = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

def sb_get(path: str, qs: str = ""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}{qs}", headers=_SB, timeout=15)
    r.raise_for_status()
    return r.json()

def mgmt_query(sql: str):
    r = requests.post(
        f"https://api.supabase.com/v1/projects/{SUPABASE_REF}/database/query",
        headers={"Authorization": f"Bearer {SUPABASE_MGMT}", "Content-Type": "application/json"},
        json={"query": sql}, timeout=15,
    )
    r.raise_for_status()
    return r.json()

# ── 1. SSR / Googlebot ────────────────────────────────────────────────────────

def check_ssr():
    print("\n[1] SSR / Googlebot")
    session = requests.Session()
    session.headers.update({"User-Agent": GOOGLEBOT_UA})

    status_fails, size_fails, noindex_fails, canonical_warns, worker_fails = [], [], [], [], []
    total = len(SITEMAP_URLS)

    for url in SITEMAP_URLS:
        slug = url.replace(BASE, "").strip("/")
        is_cat = slug in CATEGORY_SLUGS

        try:
            r = session.get(url, timeout=20, allow_redirects=True)
        except Exception as e:
            status_fails.append(f"{url}: {type(e).__name__}")
            time.sleep(0.2)
            continue

        if r.status_code != 200:
            status_fails.append(f"{url}: HTTP {r.status_code}")
            time.sleep(0.2)
            continue

        html     = r.text
        html_len = len(html)

        # Tamanho mínimo: 3000 chars para categorias (SSR real), 200 para estáticas
        min_size = 3000 if is_cat else 200
        if html_len < min_size:
            size_fails.append(f"{url}: {html_len} chars (mín {min_size})")

        # Canonical www — só verifica se a tag existe
        has_canonical = '<link rel="canonical"' in html
        if has_canonical and "www.canais18.com" not in html:
            canonical_warns.append(f"{url}: canonical sem www")

        # Categorias não devem ter noindex
        if is_cat and 'noindex' in html.lower():
            noindex_fails.append(url)

        # Categorias devem ter X-Landing-Source (confirma que o Worker interceptou)
        if is_cat and not r.headers.get("X-Landing-Source", ""):
            worker_fails.append(f"{url.replace(BASE,'') or '/'}: sem X-Landing-Source (SPA em vez de SSR)")

        time.sleep(0.25)  # gentil com os servidores

    all_issues = status_fails + size_fails + noindex_fails
    if all_issues:
        fail("SSR Googlebot",
             f"{len(all_issues)} problema(s) em {total} URLs",
             critical=True,
             details=(status_fails + size_fails + noindex_fails)[:10])
    else:
        if canonical_warns:
            warn("SSR Googlebot",
                 f"{total}/{total} URLs OK — {len(canonical_warns)} aviso(s) de canonical",
                 details=canonical_warns[:5])
        else:
            ok("SSR Googlebot", f"{total}/{total} URLs: status 200, tamanho OK, sem noindex indevido")

    # Verifica Worker interception separadamente (X-Landing-Source)
    n_cat = len(CATEGORY_SLUGS)
    if worker_fails:
        fail("SSR Worker",
             f"{len(worker_fails)}/{n_cat} categoria(s) sem X-Landing-Source (SPA servido em vez de Edge Function)",
             critical=True, details=worker_fails[:8])
    else:
        ok("SSR Worker", f"{n_cat}/{n_cat} categorias com X-Landing-Source confirmado")

# ── 2. Sitemap ────────────────────────────────────────────────────────────────

def check_sitemap():
    print("\n[2] Sitemap")

    try:
        r = requests.get(SITEMAP_URL, timeout=15)
    except Exception as e:
        fail("Sitemap fetch", str(e)); return

    if r.status_code != 200:
        fail("Sitemap HTTP", f"Status {r.status_code}"); return

    xml = r.text

    # Contagem de URLs
    url_count = xml.count("<loc>")
    try:
        rows = sb_get("seo_config", "?select=value&key=eq.sitemap_url_count")
        expected = int((rows[0]["value"] or {}).get("count", 33)) if rows else 33
    except Exception:
        expected = 33

    if url_count == expected:
        ok("Sitemap contagem", f"{url_count} URLs (esperado {expected})")
    elif abs(url_count - expected) <= 5:
        warn("Sitemap contagem", f"{url_count} URLs (esperado {expected})")
    else:
        fail("Sitemap contagem", f"{url_count} URLs (esperado {expected})", critical=False)

    # Todas as URLs devem ter www
    non_www = re.findall(r"<loc>https://canais18\.com[^<]*</loc>", xml)
    if non_www:
        fail("Sitemap www", f"{len(non_www)} URL(s) sem www",
             critical=True, details=non_www[:5])
    else:
        ok("Sitemap www", "100% das URLs usam www.canais18.com")

    # Verifica se está sendo servido pela Edge Function (não o arquivo estático do Lovable)
    source = r.headers.get("X-Sitemap-Source", "")
    if source == "edge-function":
        ok("Sitemap source", "Servido pela Edge Function Supabase")
    else:
        fail("Sitemap source", f"X-Sitemap-Source='{source}' (esperado 'edge-function') — arquivo estático com 12k URLs pode estar sendo servido",
             critical=True)

    # robots.txt deve apontar para sitemap www
    try:
        robots = requests.get(f"{BASE}/robots.txt", timeout=10).text
        if "Sitemap: https://www.canais18.com/sitemap.xml" in robots:
            ok("robots.txt Sitemap", "Aponta para www.canais18.com/sitemap.xml")
        elif "canais18.com/sitemap.xml" in robots:
            warn("robots.txt Sitemap", "Sitemap presente mas pode estar sem www")
        else:
            warn("robots.txt Sitemap", "Diretiva Sitemap não encontrada no robots.txt")
    except Exception as e:
        warn("robots.txt fetch", str(e))

# ── 3. GSC Data ───────────────────────────────────────────────────────────────

def check_gsc():
    print("\n[3] GSC Data (via seo_cache)")

    # Idade do cache
    try:
        rows = sb_get("seo_cache", "?select=data,updated_at&key=eq.dashboard")
    except Exception as e:
        fail("GSC cache fetch", str(e)); return

    if not rows:
        fail("GSC cache", "Chave 'dashboard' não encontrada no seo_cache"); return

    data      = rows[0]["data"]
    updated   = rows[0]["updated_at"]
    age_h     = (datetime.now(timezone.utc) -
                 datetime.fromisoformat(updated.replace("Z", "+00:00"))).total_seconds() / 3600

    if age_h <= 25:
        ok("GSC cache idade", f"Cache atualizado há {age_h:.1f}h")
    else:
        fail("GSC cache idade", f"Cache tem {age_h:.1f}h sem atualizar (máx 25h)", critical=False)

    # Dados não-nulos (valida propriedade www)
    try:
        d28 = data.get("28d", {})
        totals     = d28.get("totals", {}) if isinstance(d28, dict) else {}
        impressions = totals.get("impressions", 0)
        clicks      = totals.get("clicks",      0)
        position    = totals.get("position",    0.0)
        ok("GSC dados 28d", f"{impressions} impressões · {clicks} cliques · posição {position:.1f}")
    except Exception as e:
        warn("GSC dados 28d", f"Erro ao ler dados: {e}")
        return

    # Comparação com execução anterior — detecta quedas bruscas
    try:
        prev = sb_get("seo_cache", "?select=data&key=eq.dashboard_prev")
        if prev:
            prev_imp = (prev[0]["data"].get("28d", {}).get("totals", {}).get("impressions", 0))
            if prev_imp > 10 and impressions < prev_imp * 0.5:
                fail("GSC queda", f"Impressões: {prev_imp} -> {impressions} (queda >50%)", critical=True)
            else:
                ok("GSC estabilidade", f"Impressões estáveis ({prev_imp} -> {impressions})")
    except Exception:
        pass  # primeira execução sem histórico

    # Salva snapshot para próxima comparação
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/seo_cache",
            headers={**_SB, "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates"},
            json={"key": "dashboard_prev", "data": data},
            timeout=10,
        )
    except Exception:
        pass

# ── 4. Cloudflare Workers ─────────────────────────────────────────────────────

def check_cloudflare():
    print("\n[4] Cloudflare Workers")

    if not CF_TOKEN:
        warn("CF Workers", "CLOUDFLARE_API_TOKEN não configurado — verificação pulada"); return

    cf = {"Authorization": f"Bearer {CF_TOKEN}"}

    try:
        zones = requests.get("https://api.cloudflare.com/client/v4/zones?name=canais18.com",
                             headers=cf, timeout=15).json()
        zone_id = zones["result"][0]["id"]
    except Exception as e:
        warn("CF zone lookup", str(e)); return

    try:
        routes = requests.get(
            f"https://api.cloudflare.com/client/v4/zones/{zone_id}/workers/routes",
            headers=cf, timeout=15,
        ).json().get("result", [])
    except Exception as e:
        warn("CF routes lookup", str(e)); return

    # bot-prerender cobrindo www/*
    wildcard = next(
        (rt for rt in routes
         if rt.get("pattern") == "www.canais18.com/*" and rt.get("script") == "bot-prerender"),
        None
    )
    if wildcard:
        ok("CF bot-prerender", "Rota www.canais18.com/* -> bot-prerender ativa")
    else:
        fail("CF bot-prerender",
             "Rota wildcard ausente ou apontando para worker errado", critical=True)

    # Workers fantasmas — rotas www.canais18.com/[slug] que deveriam ter sido deletadas
    ghost = [rt for rt in routes
             if rt.get("pattern", "").startswith("www.canais18.com/")
             and rt.get("pattern") != "www.canais18.com/*"
             and rt.get("pattern") != "www.canais18.com/sitemap.xml"]
    if ghost:
        fail("CF Workers fantasmas",
             f"{len(ghost)} rota(s) específica(s) conflitante(s) detectada(s)",
             critical=False,
             details=[f"{rt['pattern']} -> {rt.get('script','?')}" for rt in ghost[:8]])
    else:
        ok("CF Workers fantasmas", "Nenhuma rota específica conflitante")

# ── 5. Supabase ───────────────────────────────────────────────────────────────

def check_supabase():
    print("\n[5] Supabase")

    # pg_cron jobs ativos
    if SUPABASE_MGMT:
        try:
            jobs = mgmt_query(
                "SELECT jobname, active FROM cron.job "
                "WHERE jobname IN ('daily-tasks-11h','health-check-12h')"
            )
            found = {j["jobname"]: j["active"] for j in jobs}
            for name in ("daily-tasks-11h", "health-check-12h"):
                if name not in found:
                    fail(f"pg_cron {name}", "Job não encontrado!", critical=True)
                elif found[name]:
                    ok(f"pg_cron {name}", "Ativo")
                else:
                    fail(f"pg_cron {name}", "Inativo!", critical=True)
        except Exception as e:
            warn("pg_cron", f"Não verificado: {e}")
    else:
        warn("pg_cron", "SUPABASE_ACCESS_TOKEN não configurado — verificação pulada")

    # Última visita do Googlebot
    try:
        rows = sb_get("bot_logs", "?select=created_at&order=created_at.desc&limit=1")
        if not rows:
            warn("bot_logs", "Nenhuma visita do Googlebot registrada ainda")
        else:
            last = datetime.fromisoformat(rows[0]["created_at"].replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - last).days
            if age_days > 7:
                fail("bot_logs Googlebot", f"Último acesso há {age_days} dias (máx 7)", critical=False)
            else:
                ok("bot_logs Googlebot", f"Googlebot visto há {age_days}d · {rows[0]['created_at'][:10]}")
    except Exception as e:
        warn("bot_logs", str(e))

    # seo_cache atualizado nas últimas 25h
    try:
        rows = sb_get("seo_cache", "?select=updated_at&key=eq.dashboard")
        if not rows:
            fail("seo_cache dashboard", "Não encontrado", critical=False)
        else:
            age_h = (datetime.now(timezone.utc) -
                     datetime.fromisoformat(rows[0]["updated_at"].replace("Z", "+00:00"))
                     ).total_seconds() / 3600
            if age_h > 25:
                fail("seo_cache idade", f"{age_h:.1f}h sem atualizar (máx 25h)", critical=False)
            else:
                ok("seo_cache idade", f"Atualizado há {age_h:.1f}h")
    except Exception as e:
        warn("seo_cache", str(e))

    # seo_health tasks OK
    try:
        rows = sb_get("seo_health", "?select=task,status,last_success&order=task")
        for row in rows:
            task   = row["task"]
            status = row["status"]
            last   = row.get("last_success") or ""
            age_h  = (datetime.now(timezone.utc) -
                      datetime.fromisoformat(last.replace("Z", "+00:00"))
                      ).total_seconds() / 3600 if last else float("inf")
            if status == "ok" and age_h <= 26:
                ok(f"seo_health {task}", f"OK · sucesso há {age_h:.0f}h")
            elif status == "error":
                fail(f"seo_health {task}", "Status = error", critical=False)
            else:
                warn(f"seo_health {task}", f"Status={status} · sucesso há {age_h:.0f}h")
    except Exception as e:
        warn("seo_health", str(e))

    # indexing_progress — confirma que daily-tasks enviou 33 URLs hoje
    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        rows = sb_get("indexing_progress", f"?select=sent_count,project_id&date=eq.{today_str}")
        sent_today = sum(r.get("sent_count", 0) for r in rows)
        if sent_today >= 33:
            ok("indexing_progress hoje", f"{sent_today} URLs enviadas hoje pela daily-tasks")
        elif sent_today > 0:
            warn("indexing_progress hoje", f"Apenas {sent_today}/33 URLs enviadas hoje")
        else:
            warn("indexing_progress hoje", "0 URLs enviadas hoje (normal se < 13:30 BRT, erro se tarde)")
    except Exception as e:
        warn("indexing_progress", str(e))

    # Grupos broken=true e hidden=false — visíveis no site
    try:
        if SUPABASE_MGMT:
            result = mgmt_query(
                "SELECT COUNT(*)::int AS cnt FROM public.groups "
                "WHERE broken = true AND (hidden IS NULL OR hidden = false)"
            )
            broken_count = result[0]["cnt"] if result else 0
        else:
            rows = sb_get("groups", "?select=id&broken=eq.true&hidden=not.is.true&limit=500")
            broken_count = len(rows)

        if broken_count == 0:
            ok("Grupos broken", "0 grupos quebrados visiveis no site")
        else:
            warn("Grupos broken",
                 f"{broken_count} grupo(s) com broken=true e hidden=false (visiveis para usuarios)",
                 critical=False)
    except Exception as e:
        warn("Grupos broken", str(e))

# ── 6. Canonicals e redirect www ─────────────────────────────────────────────

def check_canonicals():
    print("\n[6] Canonicals / Redirect www")

    for proto in ("https", "http"):
        url = f"{proto}://canais18.com/"
        try:
            r = requests.get(url, timeout=12, allow_redirects=False)
            code     = r.status_code
            location = r.headers.get("Location", "")
            if code in (301, 302, 308) and "www.canais18.com" in location:
                ok(f"Redirect {proto}", f"HTTP {code} -> {location.split('?')[0]}")
            elif code in (301, 302, 308):
                fail(f"Redirect {proto}",
                     f"HTTP {code} mas Location='{location}' não aponta para www", critical=False)
            elif code == 200:
                fail(f"Redirect {proto}",
                     "Retorna 200 — domínio sem www não redireciona para www!", critical=True)
            else:
                warn(f"Redirect {proto}", f"Status inesperado: {code}")
        except requests.exceptions.SSLError:
            warn(f"Redirect {proto}", "SSL error (esperado para http:// sem certificado)")
        except Exception as e:
            warn(f"Redirect {proto}", f"{type(e).__name__}: {e}")

    # Verifica que www retorna 200
    try:
        r = requests.get(f"{BASE}/", timeout=12, allow_redirects=True)
        if r.status_code == 200:
            ok("www status", f"https://www.canais18.com/ -> 200 OK")
        else:
            fail("www status", f"https://www.canais18.com/ -> HTTP {r.status_code}", critical=True)
    except Exception as e:
        fail("www fetch", str(e), critical=True)

# ── 7. RPCs críticas do Supabase ─────────────────────────────────────────────

def check_rpcs():
    print("\n[7] RPCs Supabase")

    # ── get_hot_groups ────────────────────────────────────────────────────────
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/get_hot_groups",
            headers={**_SB, "Content-Type": "application/json"},
            json={"p_limit": 1, "p_offset": 0},
            timeout=15,
        )
        if r.status_code == 200:
            rows = r.json()
            if isinstance(rows, list) and len(rows) > 0:
                total = rows[0].get("total_count", "?")
                ok("RPC get_hot_groups", f"OK -> 1 grupo retornado (total_count={total})")
            else:
                warn("RPC get_hot_groups", f"Chamada OK mas lista vazia (status {r.status_code})")
        else:
            body = r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text
            msg  = body.get("message", str(body)) if isinstance(body, dict) else str(body)
            fail("RPC get_hot_groups", f"HTTP {r.status_code}: {msg[:120]}", critical=True)
    except Exception as e:
        fail("RPC get_hot_groups", f"{type(e).__name__}: {e}", critical=True)

    # ── get_cron_schedules ────────────────────────────────────────────────────
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/get_cron_schedules",
            headers={**_SB, "Content-Type": "application/json"},
            json={},
            timeout=15,
        )
        if r.status_code == 200:
            rows = r.json()
            if isinstance(rows, list) and len(rows) > 0:
                names = ", ".join(row.get("jobname", "?") for row in rows)
                ok("RPC get_cron_schedules", f"OK -> {len(rows)} job(s): {names}")
            else:
                warn("RPC get_cron_schedules", "Chamada OK mas sem jobs retornados")
        else:
            body = r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text
            msg  = body.get("message", str(body)) if isinstance(body, dict) else str(body)
            fail("RPC get_cron_schedules", f"HTTP {r.status_code}: {msg[:120]}", critical=True)
    except Exception as e:
        fail("RPC get_cron_schedules", f"{type(e).__name__}: {e}", critical=True)

# ── 8. GSC Index Coverage via URL Inspection API ─────────────────────────────

# Estados do coverageState que indicam problema
_PROBLEM_STATES = {
    "Crawled - currently not indexed",
    "Discovered - currently not indexed",
    "Excluded by 'noindex' tag",
    "Blocked by robots.txt",
    "Soft 404",
    "Server error (5xx)",
    "Not found (404)",
    "Alternate page with proper canonical tag",
    "Page with redirect",
}
_INDEXED_STATE  = "Submitted and indexed"
_UNKNOWN_STATE  = "URL is unknown to Google"

def _build_gsc():
    creds_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    if not creds_file or not os.path.exists(creds_file):
        return None
    creds = service_account.Credentials.from_service_account_file(
        creds_file,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return gapi_build("searchconsole", "v1", credentials=creds)

def check_index_coverage():
    print("\n[8] GSC Index Coverage (URL Inspection)")

    if not _HAS_GOOGLE:
        warn("Index Coverage", "google-auth nao instalado — pulando"); return

    gsc = _build_gsc()
    if gsc is None:
        warn("Index Coverage", "GOOGLE_APPLICATION_CREDENTIALS ausente ou arquivo nao existe"); return

    site = "https://www.canais18.com/"
    results, problems, indexed, unknown = [], [], [], []

    for url in SITEMAP_URLS:
        try:
            r   = gsc.urlInspection().index().inspect(
                body={"inspectionUrl": url, "siteUrl": site}
            ).execute()
            idx   = r.get("inspectionResult", {}).get("indexStatusResult", {})
            state = idx.get("coverageState", "UNKNOWN")
            verdict  = idx.get("indexingState", "")
            crawl_t  = idx.get("lastCrawlTime", "")
            robots   = idx.get("robotsTxtState", "")
            entry = {
                "url":          url,
                "coverageState":state,
                "indexingState":verdict,
                "lastCrawlTime":crawl_t,
                "robotsTxtState": robots,
            }
            results.append(entry)
            if state == _INDEXED_STATE:
                indexed.append(url)
            elif state == _UNKNOWN_STATE or not state:
                unknown.append(url)
            elif any(prob.lower() in state.lower() for prob in _PROBLEM_STATES):
                problems.append(entry)
        except Exception as e:
            results.append({"url": url, "coverageState": f"API_ERROR: {e}", "error": True})
        time.sleep(0.4)  # 2.5 req/s < quota de 2 QPS

    # Salva no Supabase para o dashboard
    payload = {
        "timestamp":     datetime.now(timezone.utc).isoformat(),
        "site":          site,
        "total_urls":    len(SITEMAP_URLS),
        "indexed":       len(indexed),
        "unknown":       len(unknown),
        "problems":      len(problems),
        "problem_urls":  problems,
        "indexed_urls":  indexed,
    }
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/seo_cache",
            headers={**_SB, "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates"},
            json={"key": "index_coverage_result", "data": payload},
            timeout=10,
        )
    except Exception:
        pass

    # Avalia resultado
    if problems:
        details = [f"{p['url']} -> {p['coverageState']}" for p in problems]
        is_cat = any(
            any(slug in p["url"] for slug in ["telegram-", "grupos-", "onlyfans-",
                "amadoras-", "gay-", "fetiche-", "casadas-", "celebridades-",
                "asiaticas-", "bdsm-", "bbw-", "coroas-"])
            for p in problems
        )
        fail("Index Coverage",
             f"{len(problems)} URL(s) com problema de indexacao nas {len(SITEMAP_URLS)} do sitemap",
             critical=is_cat, details=details)
    else:
        ok("Index Coverage",
           f"{len(indexed)} indexadas · {len(unknown)} desconhecidas (novas) · 0 com problema")

# ── 9. GitHub Actions — status dos últimos runs ──────────────────────────────

def check_github_actions():
    print("\n[9] GitHub Actions")

    if not GITHUB_TOKEN:
        warn("GH Actions", "GITHUB_TOKEN ausente — adicione ao workflow env: GITHUB_TOKEN: ${{ github.token }}")
        return

    gh = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}
    workflows = {
        "seo_cache.yml":           "SEO Cache Update",
        "master_health_check.yml": "Master Health Check",
    }
    for filename, label in workflows.items():
        try:
            r = requests.get(
                f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{filename}/runs",
                params={"per_page": 1},
                headers=gh, timeout=15,
            )
            if r.status_code == 404:
                warn(f"GH {label}", "Workflow nao encontrado"); continue
            if r.status_code != 200:
                warn(f"GH {label}", f"API HTTP {r.status_code}"); continue

            runs = r.json().get("workflow_runs", [])
            if not runs:
                warn(f"GH {label}", "Sem execucoes registradas"); continue

            run        = runs[0]
            conclusion = run.get("conclusion")   # success | failure | cancelled | skipped
            status     = run.get("status")       # completed | in_progress | queued
            created    = run.get("created_at", "")[:16].replace("T", " ")

            if conclusion == "success":
                ok(f"GH {label}", f"OK — ultimo run: success ({created} UTC)")
            elif conclusion == "failure":
                fail(f"GH {label}",
                     f"Ultimo run FALHOU ({created} UTC) — dados podem estar desatualizados",
                     critical=True)
            elif status in ("in_progress", "queued"):
                warn(f"GH {label}", f"Em andamento ({created} UTC)")
            else:
                warn(f"GH {label}", f"conclusion={conclusion} status={status} ({created} UTC)")
        except Exception as e:
            warn(f"GH {label}", f"{type(e).__name__}: {e}")

# ── 10. Email ─────────────────────────────────────────────────────────────────

def send_report():
    has_critical = any(c.status == "fail" and c.critical for c in _results)
    has_fail     = any(c.status == "fail" for c in _results)
    counts       = {s: sum(1 for c in _results if c.status == s)
                    for s in ("ok", "warn", "fail")}

    prefix  = "[URGENTE] " if has_critical else "[ATENÇÃO] " if has_fail else "[OK] "
    subject = (f"{prefix}canais18.com Health Check — "
               f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

    bar_color   = "#f87171" if has_critical else "#fbbf24" if has_fail else "#4ade80"
    summary_txt = (
        f"{'🔴 CRÍTICO' if has_critical else '🟡 ATENÇÃO' if has_fail else '🟢 TUDO OK'} — "
        f"{counts['ok']} OK · {counts['warn']} aviso(s) · {counts['fail']} falha(s)"
    )

    icons = {"ok": "✅", "warn": "⚠️", "fail": "❌"}
    rows_html = ""
    for c in _results:
        detail_html = ""
        if c.details:
            detail_html = "<br><small style='color:#888;font-family:monospace;font-size:11px'>" + \
                          "<br>".join(c.details[:5]) + "</small>"
        rows_html += (
            f"<tr>"
            f"<td style='padding:5px 8px;border-bottom:1px solid #222;font-size:15px'>{icons[c.status]}</td>"
            f"<td style='padding:5px 8px;border-bottom:1px solid #222;color:#ddd;font-size:13px'>"
            f"{c.name}{detail_html}</td>"
            f"<td style='padding:5px 8px;border-bottom:1px solid #222;color:#888;font-size:12px'>{c.message}</td>"
            f"</tr>"
        )

    html = f"""<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;background:#111;color:#eee;padding:24px;margin:0">
<div style="max-width:720px;margin:0 auto">
  <h2 style="color:#f472b6;margin:0 0 4px">canais18.com — Health Check</h2>
  <p style="color:#555;font-size:12px;margin:0 0 16px">
    {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}
  </p>
  <div style="background:#1a1a1a;border-left:4px solid {bar_color};padding:12px 16px;
              border-radius:0 6px 6px 0;margin-bottom:20px">
    <strong style="color:{bar_color}">{summary_txt}</strong>
  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:.05em">
        <th style="padding:5px 8px;text-align:left;width:30px"></th>
        <th style="padding:5px 8px;text-align:left">Verificação</th>
        <th style="padding:5px 8px;text-align:left">Resultado</th>
      </tr>
    </thead>
    <tbody>{rows_html}</tbody>
  </table>
  <p style="color:#333;font-size:11px;margin-top:20px">
    Gerado por master_health_check.py · canais18-seo ·
    <a href="https://github.com/us3rmax/tele-gem-hub/actions" style="color:#555">Ver Actions</a>
  </p>
</div>
</body></html>"""

    if not RESEND_KEY:
        print(f"\n[Email] RESEND_API_KEY ausente — subject seria: {subject}")
        return

    r = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
        json={"from": "health@canais18.com", "to": [EMAIL_TO],
              "subject": subject, "html": html},
        timeout=15,
    )
    status = "enviado" if r.status_code in (200, 201) else f"erro {r.status_code}"
    print(f"\n[Email] {status} -> {EMAIL_TO}")

# ── Salva resultado no Supabase ───────────────────────────────────────────────

def save_result():
    has_critical = any(c.status == "fail" and c.critical for c in _results)
    has_fail     = any(c.status == "fail" for c in _results)
    counts       = {s: sum(1 for c in _results if c.status == s)
                    for s in ("ok", "warn", "fail")}

    overall = "critical" if has_critical else "warning" if has_fail else "ok"

    failures = [
        {"name": c.name, "message": c.message, "critical": c.critical,
         "details": c.details[:5]}
        for c in _results if c.status == "fail"
    ]
    warnings = [
        {"name": c.name, "message": c.message}
        for c in _results if c.status == "warn"
    ]

    payload = {
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "status":     overall,
        "total_ok":   counts["ok"],
        "total_warn": counts["warn"],
        "total_fail": counts["fail"],
        "failures":   failures,
        "warnings":   warnings,
    }

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[Supabase] Credenciais ausentes — resultado nao salvo")
        return

    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/seo_cache",
            headers={**_SB, "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates"},
            json={"key": "health_check_result", "data": payload},
            timeout=10,
        )
        if r.status_code in (200, 201):
            print(f"[Supabase] Salvo em seo_cache (key=health_check_result) | status={overall}")
        else:
            print(f"[Supabase] Erro {r.status_code}: {r.text[:120]}")
    except Exception as e:
        print(f"[Supabase] Falha ao salvar resultado: {e}")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    print("=" * 62)
    print(f"  master_health_check.py -- {now}")
    print("=" * 62)

    check_ssr()
    check_sitemap()
    check_gsc()
    check_cloudflare()
    check_supabase()
    check_canonicals()
    check_rpcs()
    check_index_coverage()
    check_github_actions()
    save_result()   # persiste no Supabase antes do email
    send_report()

    counts = {s: sum(1 for c in _results if c.status == s)
              for s in ("ok", "warn", "fail")}
    has_critical = any(c.status == "fail" and c.critical for c in _results)

    print("\n" + "=" * 62)
    print(f"  RESULTADO: {counts['ok']} OK | {counts['warn']} avisos | {counts['fail']} falhas")
    print("=" * 62)

    if has_critical:
        sys.exit(1)

if __name__ == "__main__":
    main()
