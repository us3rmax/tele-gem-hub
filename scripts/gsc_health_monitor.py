"""
gsc_health_monitor.py
Monitora cobertura de indexação via Google Search Console API.
Detecta aumentos de erro > 10% ou queda de páginas indexadas e envia alerta por email.
Salva histórico em gsc_health_cache.json e upserta no Supabase (seo_cache key=gsc_health).

Usage:
    python gsc_health_monitor.py             # roda e alerta se necessário
    python gsc_health_monitor.py --force     # força envio de email mesmo sem alerta
    python gsc_health_monitor.py --schedule  # adiciona ao Task Scheduler (10h diário)
"""

import sys, os, json, argparse
from datetime import date, timedelta

from dotenv import load_dotenv
load_dotenv()

from google.oauth2 import service_account
from googleapiclient.discovery import build
from supabase import create_client
import requests as req_lib

CREDS_FILE  = os.path.normpath(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip())
SITE        = "https://canais18.com/"
RESEND_KEY  = os.getenv("RESEND_API_KEY")
EMAIL_TO    = os.getenv("EMAIL_DESTINO", "tggrupos@proton.me")
CACHE_FILE  = os.getenv("GSC_CACHE_FILE", "/tmp/gsc_health_cache.json")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

creds = service_account.Credentials.from_service_account_file(
    CREDS_FILE,
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)
gsc = build("searchconsole", "v1", credentials=creds)


# ── GSC helpers ───────────────────────────────────────────────────────────────

def fetch_coverage():
    """Busca dados de cobertura de índice via URL Inspection / urlcrawlerrorssamples."""
    today = date.today()
    # URL Inspection API não tem endpoint de bulk — usamos Search Analytics com filtro
    # para estimar indexadas (páginas com impressões no período recente)
    end   = today - timedelta(days=1)
    start = end - timedelta(days=28)

    def fmt(d): return d.strftime("%Y-%m-%d")

    # Páginas com pelo menos 1 impressão nos últimos 28 dias = proxy de "indexadas"
    body_indexed = {
        "startDate": fmt(start), "endDate": fmt(end),
        "dimensions": ["page"], "rowLimit": 25000,
        "dataState": "all",
    }
    res_indexed = gsc.searchanalytics().query(siteUrl=SITE, body=body_indexed).execute()
    indexed_pages = {r["keys"][0] for r in res_indexed.get("rows", [])}
    indexed_count = len(indexed_pages)

    # Sitemap inspection: verifica sitemap para contar URLs submetidas
    sitemaps_res = gsc.sitemaps().list(siteUrl=SITE).execute()
    sitemaps = sitemaps_res.get("sitemap", [])

    total_submitted = 0
    total_indexed_sitemap = 0
    total_errors = 0
    sitemap_details = []

    for sm in sitemaps:
        contents = sm.get("contents", [])
        for c in contents:
            submitted = int(c.get("submitted", 0))
            indexed   = int(c.get("indexed", 0))
            total_submitted      += submitted
            total_indexed_sitemap += indexed

        errors_in = int(sm.get("errors", 0))
        warnings  = int(sm.get("warnings", 0))
        total_errors += errors_in

        sitemap_details.append({
            "path":      sm.get("path", ""),
            "lastDownloaded": sm.get("lastDownloaded", ""),
            "submitted": sum(int(c.get("submitted", 0)) for c in contents),
            "indexed":   sum(int(c.get("indexed",   0)) for c in contents),
            "errors":    errors_in,
            "warnings":  warnings,
        })

    # URL Crawl Error Samples para top erros (deprecated mas ainda funciona)
    error_types = []
    for category in ["notFound", "serverError", "soft404", "authPermissions", "flashContent"]:
        try:
            res = gsc.urlcrawlerrorssamples().list(
                siteUrl=SITE, category=category, platform="web"
            ).execute()
            count = len(res.get("urlCrawlErrorSample", []))
            if count > 0:
                error_types.append({"type": category, "count": count})
        except Exception:
            pass

    # Ordena por count desc, pega top 10
    error_types.sort(key=lambda x: -x["count"])
    error_types = error_types[:10]

    return {
        "date":              str(today),
        "indexed_28d":       indexed_count,          # páginas com impressão nos últimos 28d
        "sitemap_submitted": total_submitted,
        "sitemap_indexed":   total_indexed_sitemap,
        "sitemap_errors":    total_errors,
        "error_types":       error_types,
        "sitemaps":          sitemap_details,
    }


# ── Cache ─────────────────────────────────────────────────────────────────────

def load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"history": []}


def save_cache(cache: dict):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def get_prev(cache: dict) -> dict | None:
    history = cache.get("history", [])
    today_str = str(date.today())
    # Pega o registro mais recente que não seja hoje
    for entry in reversed(history):
        if entry.get("date") != today_str:
            return entry
    return None


# ── Alertas ───────────────────────────────────────────────────────────────────

def check_alerts(current: dict, prev: dict | None) -> list[str]:
    alerts = []
    if not prev:
        return alerts

    # Queda de páginas indexadas
    curr_idx  = current["indexed_28d"]
    prev_idx  = prev["indexed_28d"]
    if prev_idx > 0:
        drop_pct = (prev_idx - curr_idx) / prev_idx
        if drop_pct > 0.10:
            alerts.append(
                f"QUEDA DE INDEXACAO: {prev_idx} -> {curr_idx} páginas "
                f"({drop_pct*100:.1f}% de queda)"
            )

    # Aumento de erros no sitemap
    curr_err = current["sitemap_errors"]
    prev_err = prev["sitemap_errors"]
    if prev_err > 0:
        rise_pct = (curr_err - prev_err) / prev_err
        if rise_pct > 0.10:
            alerts.append(
                f"AUMENTO DE ERROS: {prev_err} -> {curr_err} erros no sitemap "
                f"(+{rise_pct*100:.1f}%)"
            )
    elif curr_err > 0 and prev_err == 0:
        alerts.append(f"NOVOS ERROS NO SITEMAP: {curr_err} erros detectados")

    # Queda de indexação via sitemap
    curr_sm = current["sitemap_indexed"]
    prev_sm = prev["sitemap_indexed"]
    if prev_sm > 0:
        sm_drop = (prev_sm - curr_sm) / prev_sm
        if sm_drop > 0.10:
            alerts.append(
                f"QUEDA NO SITEMAP INDEXADO: {prev_sm} -> {curr_sm} URLs "
                f"({sm_drop*100:.1f}% de queda)"
            )

    return alerts


def send_email(alerts: list[str], current: dict, prev: dict | None):
    if not RESEND_KEY:
        print("  [WARN] RESEND_API_KEY não configurado, pulando email")
        return

    prev_idx = prev["indexed_28d"] if prev else "N/A"
    prev_err = prev["sitemap_errors"] if prev else "N/A"

    alerts_html = "".join(
        f'<li style="color:#f87171;font-weight:bold;">{a}</li>' for a in alerts
    ) if alerts else '<li style="color:#4ade80;">Nenhum alerta — tudo normal</li>'

    error_rows = "".join(
        f"<tr><td style='padding:4px 8px;border:1px solid #333;'>{e['type']}</td>"
        f"<td style='padding:4px 8px;border:1px solid #333;text-align:right;'>{e['count']}</td></tr>"
        for e in current["error_types"]
    ) or "<tr><td colspan='2' style='padding:4px 8px;color:#888;'>Sem erros detectados</td></tr>"

    sitemap_rows = "".join(
        f"<tr>"
        f"<td style='padding:4px 8px;border:1px solid #333;font-size:11px;'>{s['path'].split('/')[-1]}</td>"
        f"<td style='padding:4px 8px;border:1px solid #333;text-align:right;'>{s['submitted']}</td>"
        f"<td style='padding:4px 8px;border:1px solid #333;text-align:right;'>{s['indexed']}</td>"
        f"<td style='padding:4px 8px;border:1px solid #333;text-align:right;color:{'#f87171' if s['errors'] > 0 else '#4ade80'};'>{s['errors']}</td>"
        f"</tr>"
        for s in current["sitemaps"]
    )

    subject = (
        f"[ALERTA] canais18.com — {len(alerts)} problema(s) detectado(s)"
        if alerts else
        f"[OK] canais18.com — Cobertura normal em {current['date']}"
    )

    html = f"""
    <div style="font-family:monospace;background:#0a0a0a;color:#e4e4e7;padding:24px;border-radius:8px;max-width:600px;">
      <h2 style="color:#f472b6;margin-top:0;">GSC Health Monitor — {current['date']}</h2>

      <h3 style="color:#a1a1aa;">Alertas</h3>
      <ul>{alerts_html}</ul>

      <h3 style="color:#a1a1aa;">Cobertura de Índice</h3>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <tr style="background:#1a1a1a;">
          <th style="padding:6px 8px;text-align:left;border:1px solid #333;">Métrica</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #333;">Hoje</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #333;">Anterior</th>
        </tr>
        <tr>
          <td style="padding:4px 8px;border:1px solid #333;">Páginas indexadas (28d)</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">{current['indexed_28d']:,}</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">{prev_idx}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;border:1px solid #333;">URLs no sitemap</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">{current['sitemap_submitted']:,}</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">—</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;border:1px solid #333;">Indexadas via sitemap</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">{current['sitemap_indexed']:,}</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">—</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;border:1px solid #333;">Erros no sitemap</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;color:{'#f87171' if current['sitemap_errors'] > 0 else '#4ade80'};">{current['sitemap_errors']}</td>
          <td style="padding:4px 8px;border:1px solid #333;text-align:right;">{prev_err}</td>
        </tr>
      </table>

      <h3 style="color:#a1a1aa;margin-top:16px;">Top Erros de Cobertura</h3>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <tr style="background:#1a1a1a;">
          <th style="padding:6px 8px;text-align:left;border:1px solid #333;">Tipo</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #333;">Amostras</th>
        </tr>
        {error_rows}
      </table>

      <h3 style="color:#a1a1aa;margin-top:16px;">Sitemaps</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;">
        <tr style="background:#1a1a1a;">
          <th style="padding:6px 8px;text-align:left;border:1px solid #333;">Sitemap</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #333;">Submetidas</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #333;">Indexadas</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #333;">Erros</th>
        </tr>
        {sitemap_rows}
      </table>

      <p style="color:#52525b;font-size:11px;margin-top:16px;">
        Gerado automaticamente por gsc_health_monitor.py — canais18-seo
      </p>
    </div>
    """

    r = req_lib.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
        json={"from": "monitor@canais18.com", "to": [EMAIL_TO], "subject": subject, "html": html},
    )
    if r.status_code in (200, 201):
        print(f"  Email enviado para {EMAIL_TO}")
    else:
        print(f"  [WARN] Resend erro {r.status_code}: {r.text[:200]}")


# ── Supabase upsert ───────────────────────────────────────────────────────────

def save_to_supabase(current: dict, alerts: list[str]):
    payload = {**current, "alerts": alerts, "saved_at": str(date.today())}
    sb.table("seo_cache").upsert(
        {"key": "gsc_health", "data": payload, "updated_at": "now()"},
        on_conflict="key"
    ).execute()
    print("  Salvo em seo_cache (key=gsc_health)")


# ── Task Scheduler ────────────────────────────────────────────────────────────

def add_to_scheduler():
    import subprocess
    task_name = "Canais18GSCHealthMonitor"
    cmd = r"python C:\canais18-seo\gsc_health_monitor.py"

    # Remove se já existir
    subprocess.run(["schtasks", "/Delete", "/TN", task_name, "/F"],
                   capture_output=True)

    result = subprocess.run([
        "schtasks", "/Create",
        "/TN", task_name,
        "/TR", cmd,
        "/SC", "DAILY",
        "/ST", "10:05",       # 5 min depois do trends_monitor (10:00)
        "/RU", os.environ.get("USERNAME", "SYSTEM"),
        "/F",
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print(f"  Task '{task_name}' criada — roda diariamente às 10:05")
    else:
        print(f"  [ERRO] schtasks: {result.stderr.strip()}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force",    action="store_true", help="Envia email mesmo sem alertas")
    parser.add_argument("--schedule", action="store_true", help="Adiciona ao Task Scheduler")
    args = parser.parse_args()

    if args.schedule:
        print("Adicionando ao Task Scheduler...")
        add_to_scheduler()
        return

    print("=" * 55)
    print("gsc_health_monitor.py")
    print("=" * 55)

    print("\nBuscando dados de cobertura GSC...")
    current = fetch_coverage()

    print(f"  Paginas indexadas (28d): {current['indexed_28d']:,}")
    print(f"  URLs no sitemap:         {current['sitemap_submitted']:,}")
    print(f"  Indexadas via sitemap:   {current['sitemap_indexed']:,}")
    print(f"  Erros no sitemap:        {current['sitemap_errors']}")
    if current["error_types"]:
        print("  Top erros de cobertura:")
        for e in current["error_types"]:
            print(f"    {e['type']}: {e['count']}")

    cache = load_cache()
    prev  = get_prev(cache)

    if prev:
        print(f"\nComparando com: {prev['date']}")
    else:
        print("\nSem dados anteriores para comparar.")

    alerts = check_alerts(current, prev)

    if alerts:
        print(f"\nALERTAS DETECTADOS ({len(alerts)}):")
        for a in alerts:
            print(f"  ! {a}")
    else:
        print("\nNenhum alerta — tudo dentro dos limites.")

    # Salva no histórico (mantém últimos 30 dias)
    history = cache.get("history", [])
    history = [h for h in history if h.get("date") != current["date"]]
    history.append(current)
    history = sorted(history, key=lambda x: x["date"])[-30:]
    cache["history"] = history
    cache["last_run"] = current["date"]
    save_cache(cache)
    print(f"\nCache salvo em {CACHE_FILE}")

    save_to_supabase(current, alerts)

    if alerts or args.force:
        print("\nEnviando email...")
        send_email(alerts, current, prev)
    else:
        print("Sem alertas — email não enviado (use --force para forcar).")

    print("\nConcluido.")


if __name__ == "__main__":
    main()
