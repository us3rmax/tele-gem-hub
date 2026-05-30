import sys
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
import os, json, requests
from datetime import datetime, date, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from supabase import create_client

load_dotenv()

CREDS_FILE = os.path.normpath(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip())
SITE       = "https://www.canais18.com/"
sb         = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

creds = service_account.Credentials.from_service_account_file(
    CREDS_FILE, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)
gsc = build("searchconsole", "v1", credentials=creds)

hoje = date.today()
STR  = lambda d: d.strftime("%Y-%m-%d")

def fetch_totals(start, end):
    body = {"startDate": STR(start), "endDate": STR(end), "dimensions": [], "rowLimit": 1}
    rows = gsc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
    if rows:
        r = rows[0]
        return {"clicks": r["clicks"], "impressions": r["impressions"],
                "ctr": round(r["ctr"], 4), "position": round(r["position"], 2)}
    return {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}

def fetch_dim(start, end, dim, limit=20):
    body = {
        "startDate": STR(start), "endDate": STR(end),
        "dimensions": [dim], "rowLimit": limit,
        "orderBy": [{"fieldName": "impressions", "sortOrder": "DESCENDING"}],
    }
    rows = gsc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
    return [{"key": r["keys"][0], "clicks": r["clicks"],
             "impressions": r["impressions"], "ctr": round(r["ctr"], 4),
             "position": round(r["position"], 2)} for r in rows]

def fetch_daily(start, end):
    body = {
        "startDate": STR(start), "endDate": STR(end),
        "dimensions": ["date"],
        "orderBy": [{"fieldName": "date", "sortOrder": "ASCENDING"}],
        "rowLimit": 100,
    }
    rows = gsc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
    return [{"date": r["keys"][0], "clicks": r["clicks"],
             "impressions": r["impressions"]} for r in rows]

def build_period(days):
    end   = hoje - timedelta(days=1)
    start = end - timedelta(days=days - 1)
    prev_end   = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)

    totals      = fetch_totals(start, end)
    totals_prev = fetch_totals(prev_start, prev_end)
    queries     = fetch_dim(start, end, "query", 20)
    queries_prev = fetch_dim(prev_start, prev_end, "query", 20)
    pages       = fetch_dim(start, end, "page", 20)
    pages_prev  = fetch_dim(prev_start, prev_end, "page", 20)
    daily       = fetch_daily(start, end)

    # Adiciona delta às queries
    q_map = {r["key"]: r for r in queries_prev}
    for q in queries:
        p = q_map.get(q["key"], {})
        q["delta_impressions"] = q["impressions"] - p.get("impressions", 0)
        q["delta_position"]    = round(q["position"] - p.get("position", q["position"]), 2)

    p_map = {r["key"]: r for r in pages_prev}
    for p in pages:
        pv = p_map.get(p["key"], {})
        p["delta_impressions"] = p["impressions"] - pv.get("impressions", 0)

    return {
        "period_start": STR(start),
        "period_end":   STR(end),
        "totals":       totals,
        "totals_prev":  totals_prev,
        "queries":      queries,
        "pages":        pages,
        "daily":        daily,
    }

# ── Busca dados do Supabase ────────────────────────────────────────────────────
def fetch_supabase_stats():
    total = sb.table("groups").select("id", count="exact").execute().count
    cats  = sb.table("groups").select("category").execute()
    cat_count = {}
    for r in cats.data:
        c = (r.get("category") or "sem categoria").lower().strip()
        cat_count[c] = cat_count.get(c, 0) + 1

    week_ago = STR(hoje - timedelta(days=7))
    recent = sb.table("groups").select("id", count="exact") \
        .gte("created_at", week_ago).execute().count

    # Lê progresso de indexação da tabela indexing_progress no Supabase
    prog = sb.table("indexing_progress").select("project_id, date, sent_count").execute()
    sent_total = sum(r["sent_count"] for r in prog.data) if prog.data else 0
    last_run = max((r["date"] for r in prog.data), default="—") if prog.data else "—"
    projects_today = {
        r["project_id"]: r["sent_count"]
        for r in prog.data
        if r["date"] == STR(hoje)
    } if prog.data else {}

    indexing = {
        "total":         total,
        "sent":          sent_total,
        "errors":        0,
        "last_run":      last_run,
        "projects_today": projects_today,
    }

    return {
        "total_groups": total,
        "new_last_7d":  recent,
        "categories":   sorted(cat_count.items(), key=lambda x: -x[1])[:15],
        "indexing":     indexing,
    }

# ── Gera e salva o cache ───────────────────────────────────────────────────────
print("Buscando GSC 7d...")
data_7d  = build_period(7)
print("Buscando GSC 28d...")
data_28d = build_period(28)
print("Buscando GSC 90d...")
data_90d = build_period(90)
print("Buscando Supabase stats...")
sb_stats = fetch_supabase_stats()

cache = {
    "7d":      data_7d,
    "28d":     data_28d,
    "90d":     data_90d,
    "supabase": sb_stats,
    "updated_at": STR(hoje),
}

# Upsert no Supabase
sb.table("seo_cache").upsert(
    {"key": "dashboard", "data": cache, "updated_at": "now()"},
    on_conflict="key"
).execute()

# Reporte de saúde
now_iso = datetime.now().isoformat()
sb.table("seo_health").upsert(
    {
        "task": "daily-tasks",
        "last_run": now_iso,
        "last_success": now_iso,
        "status": "ok",
        "last_error": None
    },
    on_conflict="task"
).execute()

print(f"\nCache salvo em seo_cache (key=dashboard)")
print(f"  7d:  {data_7d['totals']['impressions']} impressões, {data_7d['totals']['clicks']} cliques")
print(f"  28d: {data_28d['totals']['impressions']} impressões, {data_28d['totals']['clicks']} cliques")
print(f"  90d: {data_90d['totals']['impressions']} impressões, {data_90d['totals']['clicks']} cliques")
print(f"  Grupos: {sb_stats['total_groups']} total, {sb_stats['new_last_7d']} novos esta semana")
idx = sb_stats['indexing']
print(f"  Indexing: {idx['sent']} URLs enviadas (total histórico) | último run: {idx['last_run']}")
print(f"  Hoje por projeto: {idx['projects_today']}")
