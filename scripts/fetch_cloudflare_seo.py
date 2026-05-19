import requests
import json
import os
from datetime import datetime, timedelta

ZONE_ID = "bb4b94d6f93ea90dd6151cb209edfba6"
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN")

def fetch_cloudflare_data():
    url = "https://api.cloudflare.com/client/v4/graphql"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # GraphQL usa datas em formato YYYY-MM-DD para httpRequests1dGroups
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    query = """
    query ($zoneTag: String!, $date: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            filter: { date: $date }
            limit: 1
          ) {
            sum {
              requests
              cachedRequests
              pageViews
            }
          }
        }
      }
    }
    """
    
    variables = {
        "zoneTag": ZONE_ID,
        "date": yesterday
    }
    
    response = requests.post(url, headers=headers, json={"query": query, "variables": variables})
    if response.status_code == 200:
        data = response.json()
        if data.get("data") and data["data"]["viewer"]["zones"]:
            zone_data = data["data"]["viewer"]["zones"][0]
            stats = zone_data["httpRequests1dGroups"][0]["sum"] if zone_data["httpRequests1dGroups"] else {"requests": 0, "cachedRequests": 0}
            
            requests_total = stats["requests"]
            cached_total = stats["cachedRequests"]
            cache_hit_rate = (cached_total / requests_total * 100) if requests_total > 0 else 0
            
            # Para Googlebot e 404 reais, precisamos de dados adaptativos (amostrados)
            # que funcionam no plano Free mas com limites
            
            adaptive_query = """
            query ($zoneTag: String!, $datetime: datetime!) {
              viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                  googlebot: httpRequestsAdaptiveGroups(
                    filter: { 
                      datetime_gt: $datetime,
                      userAgent_like: "%Googlebot%"
                    }
                    limit: 1
                  ) {
                    count
                  }
                  errors404: httpRequestsAdaptiveGroups(
                    filter: { 
                      datetime_gt: $datetime,
                      edgeResponseStatus: 404
                    }
                    limit: 1
                  ) {
                    count
                  }
                }
              }
            }
            """
            
            dt_yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            adaptive_vars = {
                "zoneTag": ZONE_ID,
                "datetime": dt_yesterday
            }
            
            adaptive_resp = requests.post(url, headers=headers, json={"query": adaptive_query, "variables": adaptive_vars})
            googlebot_count = 0
            errors404_count = 0
            
            if adaptive_resp.status_code == 200:
                a_data = adaptive_resp.json()
                if a_data.get("data"):
                    a_zone = a_data["data"]["viewer"]["zones"][0]
                    googlebot_count = a_zone["googlebot"][0]["count"] if a_zone["googlebot"] else 0
                    errors404_count = a_zone["errors404"][0]["count"] if a_zone["errors404"] else 0

            result = {
                "googlebot_visits_24h": googlebot_count,
                "errors_404_24h": errors404_count,
                "cache_hit_rate": round(cache_hit_rate, 2),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            print(json.dumps(result, indent=2))
            return result
        else:
            print(f"No data returned: {data}")
            return None
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

if __name__ == "__main__":
    fetch_cloudflare_data()
