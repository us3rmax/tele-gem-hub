import requests
import json
import os
from datetime import datetime, timedelta

# Configurações
ZONE_ID = "bb4b94d6f93ea90dd6151cb209edfba6"
CF_API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN")
SUPABASE_URL = "https://lymjjozpdsdoloahsyey.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgxMDQsImV4cCI6MjA4NjU2NDEwNH0.dC2d16T0DHt67rDr4RFuTU4hg79vxj0YUGf91xdxdBs"

def fetch_cf_data():
    url = "https://api.cloudflare.com/client/v4/graphql"
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # 1. Cache Stats (1d) - Usando data fixa (ontem)
    yesterday_date = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    query_1d = """
    query ($zoneTag: String!, $date: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(filter: { date: $date }, limit: 1) {
            sum {
              requests
              cachedRequests
            }
          }
        }
      }
    }
    """
    
    # 2. Adaptive Stats (Googlebot & 404)
    # Ajuste: Usar 23h para evitar erro de "wider than 1d" devido a milissegundos
    dt_yesterday = (datetime.utcnow() - timedelta(hours=23, minutes=50)).strftime("%Y-%m-%dT%H:%M:%SZ")
    query_adaptive = """
    query ($zoneTag: String!, $datetime: datetime!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          googlebot: httpRequestsAdaptiveGroups(
            filter: { datetime_gt: $datetime, userAgent_like: "%Googlebot%" },
            limit: 1
          ) { count }
          errors404: httpRequestsAdaptiveGroups(
            filter: { datetime_gt: $datetime, edgeResponseStatus: 404 },
            limit: 1
          ) { count }
        }
      }
    }
    """
    
    try:
        # Fetch 1d stats
        resp1 = requests.post(url, headers=headers, json={"query": query_1d, "variables": {"zoneTag": ZONE_ID, "date": yesterday_date}})
        data1 = resp1.json()
        zones1 = data1.get("data", {}).get("viewer", {}).get("zones", [])
        
        requests_total = 0
        cached_total = 0
        if zones1 and zones1[0].get("httpRequests1dGroups"):
            stats_1d = zones1[0]["httpRequests1dGroups"][0]["sum"]
            requests_total = stats_1d.get("requests", 0)
            cached_total = stats_1d.get("cachedRequests", 0)
        
        cache_hit_rate = (cached_total / requests_total * 100) if requests_total > 0 else 0
        
        # Fetch adaptive stats
        resp2 = requests.post(url, headers=headers, json={"query": query_adaptive, "variables": {"zoneTag": ZONE_ID, "datetime": dt_yesterday}})
        data2 = resp2.json()
        zones2 = data2.get("data", {}).get("viewer", {}).get("zones", [])
        
        googlebot_count = 0
        errors404_count = 0
        if zones2:
            a_zone = zones2[0]
            googlebot_count = a_zone["googlebot"][0]["count"] if a_zone.get("googlebot") else 0
            errors404_count = a_zone["errors404"][0]["count"] if a_zone.get("errors404") else 0
        
        return {
            "googlebot_visits_24h": googlebot_count,
            "errors_404_24h": errors404_count,
            "cache_hit_rate": round(cache_hit_rate, 2),
            "updated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Error fetching CF data: {e}")
        if 'data1' in locals(): print(f"Response 1: {json.dumps(data1)}")
        if 'data2' in locals(): print(f"Response 2: {json.dumps(data2)}")
        return None

def update_supabase(data):
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("SUPABASE_SERVICE_ROLE_KEY not found")
        return
    
    url = f"{SUPABASE_URL}/rest/v1/seo_cache"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    payload = {
        "key": "cloudflare_stats",
        "data": data,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Upsert
    resp = requests.post(url, headers=headers, json=payload, params={"on_conflict": "key"})
    if resp.status_code in [200, 201, 204]:
        print("Supabase cache updated successfully")
        
        # Reporte de saúde (opcional, mas bom para monitorar)
        health_payload = {
            "task": "cloudflare-stats",
            "last_run": datetime.utcnow().isoformat(),
            "last_success": datetime.utcnow().isoformat(),
            "status": "ok",
            "last_error": None
        }
        requests.post(f"{SUPABASE_URL}/rest/v1/seo_health", headers=headers, json=health_payload, params={"on_conflict": "task"})
    else:
        print(f"Error updating Supabase: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    cf_data = fetch_cf_data()
    if cf_data:
        update_supabase(cf_data)
