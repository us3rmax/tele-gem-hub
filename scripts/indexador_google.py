import json
import time
import requests
import xml.etree.ElementTree as ET
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

# 1. Configurações Iniciais
KEYS_FILE = "credentials.json"  # O utilizador deve garantir que este ficheiro existe no ambiente de execução
SITEMAP_FILE = "public/sitemap.xml"
SCOPES = ["https://www.googleapis.com/auth/indexing"]
API_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"

def carregar_urls_do_sitemap(caminho_arquivo):
    urls = []
    try:
        tree = ET.parse(caminho_arquivo)
        root = tree.getroot()
        # O sitemap usa namespaces, precisamos lidar com isso
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        for url_tag in root.findall('ns:url', namespace):
            loc_tag = url_tag.find('ns:loc', namespace)
            if loc_tag is not None and loc_tag.text:
                urls.append(loc_tag.text.strip())
    except Exception as e:
        print(f"[-] Erro ao ler o sitemap: {e}")
    return urls

def main():
    # 2. Autenticação oficial via Google Auth
    try:
        credentials = service_account.Credentials.from_service_account_file(
            KEYS_FILE, scopes=SCOPES
        )
        session = AuthorizedSession(credentials)
        print("[+] Autenticação realizada com sucesso.")
    except Exception as e:
        print(f"[-] Erro na autenticação: {e}")
        print("[-] Certifique-se de que o ficheiro 'credentials.json' está presente.")
        return

    # 3. Carregar as URLs do sitemap
    try:
        urls = carregar_urls_do_sitemap(SITEMAP_FILE)
        print(f"[+] Total de URLs encontradas no sitemap: {len(urls)}")
        # O utilizador solicitou ler as primeiras 290 URLs
        urls_para_processar = urls[:290]
        print(f"[+] URLs selecionadas para processamento: {len(urls_para_processar)}")
    except FileNotFoundError:
        print(f"[-] Arquivo {SITEMAP_FILE} não encontrado.")
        return

    # 4. Loop de envio com controle de concorrência e limite de cota
    # A cota padrão da Indexing API varia, mas o script processará até 290 conforme solicitado
    total = len(urls_para_processar)
    for i, url in enumerate(urls_para_processar, start=1):
        payload = {
            "url": url,
            "type": "URL_UPDATED"  # Força o status de atualização/inserção imediata
        }
        
        try:
            response = session.post(API_ENDPOINT, json=payload)
            
            if response.status_code == 200:
                print(f"[{i}/{total}] Sucesso: {url}")
            else:
                print(f"[-] Erro na URL {url} | Status: {response.status_code} | Resposta: {response.text}")
                
        except Exception as e:
            print(f"[-] Falha ao processar {url}: {e}")
        
        # Pequena pausa de 1.5 segundos entre requisições para evitar HTTP 429 (Too Many Requests)
        time.sleep(1.5)

if __name__ == "__main__":
    main()
