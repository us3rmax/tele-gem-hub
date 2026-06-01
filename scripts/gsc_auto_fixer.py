import os, sys, json, time
from datetime import datetime, timezone
from google.oauth2 import service_account
from googleapiclient.discovery import build
import requests

# Configurações
CREDS_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
SITE_URL = "https://www.canais18.com/"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

def build_gsc_service():
    if not CREDS_FILE or not os.path.exists(CREDS_FILE):
        return None
    creds = service_account.Credentials.from_service_account_file(
        CREDS_FILE,
        scopes=[
            "https://www.googleapis.com/auth/webmasters.readonly",
            "https://www.googleapis.com/auth/indexing"
        ]
    )
    return build("searchconsole", "v1", credentials=creds)

def get_non_indexed_urls(gsc):
    """
    Tenta obter URLs com problemas de indexação. 
    Como a API do GSC não permite listar 'Excluídas' diretamente em massa,
    usamos o Search Analytics para encontrar URLs que deveriam estar lá mas não têm cliques/impressões,
    ou usamos amostras de erros de rastreamento.
    """
    print("[+] Buscando URLs com possíveis problemas de indexação...")
    # Por agora, vamos focar em URLs que estão no sitemap mas não aparecem no Search Analytics (0 impressões)
    # No futuro, podemos expandir para ler amostras de erros via API se disponível.
    return []

def inspect_and_fix_url(gsc, url):
    """Inspeciona uma URL e solicita indexação se necessário."""
    try:
        res = gsc.urlInspection().index().inspect(
            body={"inspectionUrl": url, "siteUrl": SITE_URL}
        ).execute()
        
        result = res.get("inspectionResult", {}).get("indexStatusResult", {})
        verdict = result.get("verdict", "UNKNOWN")
        coverage = result.get("coverageState", "UNKNOWN")
        
        print(f"  - URL: {url} | Verdict: {verdict} | Coverage: {coverage}")
        
        # Se não estiver indexada ou tiver erro corrigível
        if verdict != "PASS":
            print(f"    [!] Solicitando indexação prioritária para: {url}")
            # Aqui chamamos a Indexing API (publish)
            # Nota: O gsc service precisa do escopo de indexing
            indexing_api = build("indexing", "v3", credentials=gsc._http.credentials)
            indexing_api.urlNotifications().publish(
                body={"url": url, "type": "URL_UPDATED"}
            ).execute()
            return {"url": url, "status": "fix_requested", "reason": coverage}
            
    except Exception as e:
        print(f"    [-] Erro ao processar {url}: {e}")
        return {"url": url, "status": "error", "message": str(e)}
    
    return {"url": url, "status": "ok", "reason": coverage}

def main():
    print("="*60)
    print(f"GSC Auto-Fixer Run: {datetime.now(timezone.utc).isoformat()}")
    print("="*60)
    
    gsc = build_gsc_service()
    if not gsc:
        print("[-] Credenciais do Google não encontradas.")
        return

    # 1. Pegar URLs do sitemap para validar
    try:
        sitemap_res = requests.get(f"{SITE_URL}sitemap.xml", timeout=15)
        import re
        urls = re.findall(r'<loc>(https://www.canais18.com/group/[^<]+)</loc>', sitemap_res.text)
        # Pega uma amostra de 20 URLs para não estourar a cota da API de Inspeção (2000/dia)
        # Focamos nas mais recentes ou aleatórias
        urls_to_check = urls[-20:] 
    except Exception as e:
        print(f"[-] Erro ao ler sitemap: {e}")
        return

    fixes = []
    for url in urls_to_check:
        res = inspect_and_fix_url(gsc, url)
        fixes.append(res)
        time.sleep(1) # Be gentle

    # Salva resultado no Supabase para o relatório diário
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_checked": len(urls_to_check),
        "fixes_requested": len([f for f in fixes if f["status"] == "fix_requested"]),
        "details": fixes
    }
    
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/seo_cache",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates"
                },
                json={"key": "gsc_auto_fixes", "data": report},
                timeout=10
            )
            print("[+] Relatório de auto-fixes salvo no Supabase.")
        except Exception as e:
            print(f"[-] Erro ao salvar no Supabase: {e}")

if __name__ == "__main__":
    main()
