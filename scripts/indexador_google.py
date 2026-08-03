"""
indexador_google.py — Google Indexing API Sender
=================================================
Envia URLs para a Google Indexing API para indexação instantânea.

Uso como módulo (dentro do auto_release.py):
    from indexador_google import indexar_urls
    resultados = indexar_urls([url1, url2, url3], max_retries=3)

Uso como script standalone (lê sitemap):
    python indexador_google.py [--sitemap URL] [--limit N]

Dependências: google-auth, google-auth-httplib2, requests
"""

import json
import sys
import time
import argparse
import requests
import xml.etree.ElementTree as ET
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

# Configurações
SCOPES = ["https://www.googleapis.com/auth/indexing"]
API_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"

# Cota da API: 200 requisições/dia para sites com < 100k URLs
# https://developers.google.com/search/apis/indexing-api/v3/quotas
MAX_DAILY_REQUESTS = 200
DELAY_BETWEEN_REQUESTS = 1.5  # segundos entre requisições


def autenticar(credentials_file: str) -> AuthorizedSession:
    """Autentica via Google Service Account e retorna uma sessão autorizada."""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file, scopes=SCOPES
        )
        session = AuthorizedSession(credentials)
        print("[+] Autenticação Google OK")
        return session
    except Exception as e:
        print(f"[-] Erro na autenticação Google: {e}")
        return None


def carregar_urls_do_sitemap(caminho_ou_url: str) -> list:
    """Carrega URLs de um sitemap (local ou remoto)."""
    urls = []
    try:
        if caminho_ou_url.startswith("http"):
            print(f"[+] Buscando sitemap remoto: {caminho_ou_url}")
            response = requests.get(caminho_ou_url, timeout=30)
            response.raise_for_status()
            content = response.content
        else:
            with open(caminho_ou_url, 'rb') as f:
                content = f.read()

        root = ET.fromstring(content)
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        for url_tag in root.findall('ns:url', namespace):
            loc_tag = url_tag.find('ns:loc', namespace)
            if loc_tag is not None and loc_tag.text:
                urls.append(loc_tag.text.strip())
    except Exception as e:
        print(f"[-] Erro ao ler o sitemap: {e}")
    return urls


def indexar_urls(
    urls: list,
    credentials_file: str = "/tmp/gcp_credentials.json",
    max_urls: int = None,
    delay: float = DELAY_BETWEEN_REQUESTS,
    max_retries: int = 2,
) -> dict:
    """
    Envia uma lista de URLs para a Google Indexing API.

    Args:
        urls: Lista de URLs para indexar
        credentials_file: Caminho para o credentials.json do Google
        max_urls: Limite máximo de URLs a processar (default: MAX_DAILY_REQUESTS)
        delay: Segundos entre requisições
        max_retries: Tentativas de retry em caso de erro 429/5xx

    Returns:
        dict com contadores: {"sucesso": int, "erro": int, "rate_limited": int}
    """
    if not urls:
        return {"sucesso": 0, "erro": 0, "rate_limited": 0}

    limit = min(len(urls), max_urls or MAX_DAILY_REQUESTS)
    urls_para_processar = urls[:limit]

    print(f"\n🔍 Fase Indexação: Enviando {len(urls_para_processar)} URLs para Google...")

    session = autenticar(credentials_file)
    if not session:
        return {"sucesso": 0, "erro": 0, "rate_limited": 0}

    resultados = {"sucesso": 0, "erro": 0, "rate_limited": 0}
    total = len(urls_para_processar)

    for i, url in enumerate(urls_para_processar, start=1):
        payload = {
            "url": url,
            "type": "URL_UPDATED"
        }

        enviado = False
        for tentativa in range(max_retries + 1):
            try:
                response = session.post(API_ENDPOINT, json=payload)

                if response.status_code == 200:
                    print(f"  [{i}/{total}] ✅ {url[:80]}")
                    resultados["sucesso"] += 1
                    enviado = True
                    break
                elif response.status_code == 429:
                    resultados["rate_limited"] += 1
                    print(f"  [{i}/{total}] ⏳ Rate limit (429), aguardando {delay * 3}s...")
                    time.sleep(delay * 3)
                    continue
                elif response.status_code in (500, 502, 503):
                    print(f"  [{i}/{total}] ⚠️ Server error {response.status_code}, retry {tentativa+1}/{max_retries}...")
                    time.sleep(delay * 2)
                    continue
                else:
                    print(f"  [{i}/{total}] ❌ {response.status_code} | {url[:60]} | {response.text[:100]}")
                    resultados["erro"] += 1
                    enviado = True
                    break

            except Exception as e:
                if tentativa < max_retries:
                    time.sleep(delay * 2)
                else:
                    print(f"  [{i}/{total}] ❌ Exceção: {e}")
                    resultados["erro"] += 1

            time.sleep(delay)

    print(f"\n📊 Resultado: {resultados['sucesso']} sucesso, {resultados['erro']} erro, {resultados['rate_limited']} rate-limited")
    return resultados


def main():
    """Modo standalone: lê sitemap e indexa URLs."""
    parser = argparse.ArgumentParser(description="Google Indexing API - Enviar URLs para indexação")
    parser.add_argument("--sitemap", default="https://www.canais18.com/sitemap.xml", help="URL ou caminho do sitemap")
    parser.add_argument("--limit", type=int, default=290, help="Número máximo de URLs")
    parser.add_argument("--credentials", default="/tmp/gcp_credentials.json", help="Caminho para credentials.json")
    args = parser.parse_args()

    urls = carregar_urls_do_sitemap(args.sitemap)
    if not urls:
        urls = carregar_urls_do_sitemap("public/sitemap.xml")

    if not urls:
        print("[-] Nenhuma URL encontrada.")
        sys.exit(1)

    print(f"[+] Total de URLs no sitemap: {len(urls)}")
    print(f"[+] Limitando para: {min(args.limit, len(urls))}")

    resultados = indexar_urls(urls, credentials_file=args.credentials, max_urls=args.limit)

    # Salvar log
    with open("/tmp/indexacao_log.json", "w") as f:
        json.dump({
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_urls": len(urls),
            "processed": min(args.limit, len(urls)),
            **resultados,
        }, f)

    print(f"\n[+] Log salvo em /tmp/indexacao_log.json")


if __name__ == "__main__":
    main()
