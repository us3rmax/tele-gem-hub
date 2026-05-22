import sys
sys.stdout.reconfigure(encoding="utf-8")

import os, json, requests
from datetime import date, timedelta, datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from supabase import create_client

# ── Configurações ──────────────────────────────────────────────────────────────
CREDS_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "/home/ubuntu/tele-gem-hub/scripts/credentials.json")
SITE       = "https://www.canais18.com/"
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://lymjjozpdsdoloahsyey.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
CF_TOKEN     = os.getenv("CLOUDFLARE_API_TOKEN")

if not SUPABASE_KEY:
    print("ERRO: SUPABASE_SERVICE_KEY não configurada.")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_gsc_data():
    print("  > Buscando dados do Google Search Console...")
    try:
        creds = service_account.Credentials.from_service_account_file(
            CREDS_FILE, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
        )
        gsc = build("searchconsole", "v1", credentials=creds)
    except Exception as e:
        print(f"    [!] Erro de Autenticação GSC: {e}")
        return None

    hoje = date.today()
    STR  = lambda d: d.strftime("%Y-%m-%d")

    def fetch_period(days):
        end   = hoje - timedelta(days=3)
        start = end - timedelta(days=days - 1)
        prev_end   = start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=days - 1)

        def get_totals(s, e):
            body = {"startDate": STR(s), "endDate": STR(e), "dimensions": [], "rowLimit": 1}
            res = gsc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
            if res:
                r = res[0]
                return {"clicks": r["clicks"], "impressions": r["impressions"], "ctr": round(r["ctr"], 4), "position": round(r["position"], 2)}
            return {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}

        def get_dim(s, e, dim):
            body = {"startDate": STR(s), "endDate": STR(e), "dimensions": [dim], "rowLimit": 20, "orderBy": [{"fieldName": "impressions", "sortOrder": "DESCENDING"}]}
            res = gsc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
            return [{"key": r["keys"][0], "clicks": r["clicks"], "impressions": r["impressions"], "ctr": round(r["ctr"], 4), "position": round(r["position"], 2)} for r in res]

        def get_daily(s, e):
            body = {"startDate": STR(s), "endDate": STR(e), "dimensions": ["date"], "orderBy": [{"fieldName": "date", "sortOrder": "ASCENDING"}], "rowLimit": 100}
            res = gsc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
            return [{"date": r["keys"][0], "clicks": r["clicks"], "impressions": r["impressions"]} for r in res]

        return {
            "period_start": STR(start), "period_end": STR(end),
            "totals": get_totals(start, end), "totals_prev": get_totals(prev_start, prev_end),
            "queries": get_dim(start, end, "query"), "pages": get_dim(start, end, "page"),
            "daily": get_daily(start, end)
        }

    return {"7d": fetch_period(7), "28d": fetch_period(28), "90d": fetch_period(90)}

def fetch_sb_stats():
    print("  > Buscando estatísticas do Supabase...")
    try:
        total = sb.table("groups").select("id", count="exact").execute().count
        cats  = sb.table("groups").select("category").execute()
        cat_count = {}
        for r in cats.data:
            c = (r.get("category") or "geral").lower().strip()
            cat_count[c] = cat_count.get(c, 0) + 1
        
        week_ago = (date.today() - timedelta(days=7)).strftime("%Y-%m-%d")
        new_7d = sb.table("groups").select("id", count="exact").gte("created_at", week_ago).execute().count

        return {
            "total_groups": total,
            "new_last_7d": new_7d,
            "new_this_week": new_7d,
            "categories": sorted(cat_count.items(), key=lambda x: -x[1])[:15]
        }
    except Exception as e:
        print(f"    [!] Erro Supabase Stats: {e}")
        return None

def fetch_cf_stats():
    if not CF_TOKEN:
        print("    [!] CLOUDFLARE_API_TOKEN não configurado. Pulando...")
        return None
    
    print("  > Buscando dados do Cloudflare...")
    try:
        headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}
        zones = requests.get("https://api.cloudflare.com/client/v4/zones?name=canais18.com", headers=headers).json()
        zone_id = zones["result"][0]["id"]
        now = datetime.utcnow()
        yesterday = (now - timedelta(days=1)).isoformat() + "Z"
        query = """
        query GetStats($zoneTag: string, $since: string) {
          viewer {
            zones(filter: {zoneTag: $zoneTag}) {
              httpRequests1dGroups(filter: {date_gt: $since}, limit: 1) {
                sum {
                  requests
                  cachedRequests
                }
              }
              googlebot: httpRequestsAdaptiveGroups(
                filter: {
                  date_gt: $since,
                  userAgent_like: "%Googlebot%"
                },
                limit: 1000
              ) {
                count
              }
              errors404: httpRequestsAdaptiveGroups(
                filter: {
                  date_gt: $since,
                  edgeResponseStatus: 404
                },
                limit: 1000
              ) {
                count
              }
            }
          }
        }
        """
        variables = {"zoneTag": zone_id, "since": yesterday}
        r = requests.post("https://api.cloudflare.com/client/v4/graphql", headers=headers, json={"query": query, "variables": variables}).json()
        zone_data = r["data"]["viewer"]["zones"][0]
        googlebot_visits = sum(item["count"] for item in zone_data["googlebot"])
        errors_404 = sum(item["count"] for item in zone_data["errors404"])
        http_stats = zone_data["httpRequests1dGroups"][0]["sum"]
        total_reqs = http_stats["requests"]
        cached_reqs = http_stats["cachedRequests"]
        cache_rate = round((cached_reqs / total_reqs * 100), 2) if total_reqs > 0 else 0
        return {
            "googlebot_visits_24h": googlebot_visits,
            "errors_404_24h": errors_404,
            "cache_hit_rate": cache_rate,
            "updated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"    [!] Erro Cloudflare Stats: {e}")
        return None

def main():
    print(f"Iniciando atualização de cache SEO: {datetime.now()}")
    gsc_data = fetch_gsc_data()
    sb_stats = fetch_sb_stats()
    cf_stats = fetch_cf_stats()
    final_cache = {"updated_at": datetime.utcnow().isoformat()}
    if gsc_data: final_cache.update(gsc_data)
    if sb_stats: final_cache["supabase"] = sb_stats
    try:
        print("  > Salvando 'dashboard' no Supabase...")
        sb.table("seo_cache").upsert({"key": "dashboard", "data": final_cache, "updated_at": "now()"}, on_conflict="key").execute()
    except Exception as e:
        print(f"    [!] Erro ao salvar dashboard: {e}")
    if cf_stats:
        try:
            print("  > Salvando 'cloudflare_stats' no Supabase...")
            sb.table("seo_cache").upsert({"key": "cloudflare_stats", "data": cf_stats, "updated_at": "now()"}, on_conflict="key").execute()
        except Exception as e:
            print(f"    [!] Erro ao salvar cf_stats: {e}")
    print("Operação finalizada com sucesso!")

if __name__ == "__main__":
    main()
