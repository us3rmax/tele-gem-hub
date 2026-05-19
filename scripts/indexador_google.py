import json
import time
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

# 1. Configurações Iniciais
KEYS_FILE = "credentials.json"  # Nome do seu arquivo de credenciais do Google Cloud
URLS_FILE = "urls.txt"          # Arquivo de texto contendo uma URL por linha (as 268 URLs)
SCOPES = ["https://www.googleapis.com/auth/indexing"]
API_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"

def carregar_urls(caminho_arquivo):
    with open(caminho_arquivo, "r", encoding="utf-8") as f:
        return [linha.strip() for list_linha in f if (linha := list_linha.strip())]

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
        return

    # 3. Carregar as URLs do arquivo
    try:
        urls = carregar_urls(URLS_FILE)
        print(f"[+] Total de URLs carregadas: {len(urls)}")
    except FileNotFoundError:
        print(f"[-] Arquivo {URLS_FILE} não encontrado.")
        return

    # 4. Loop de envio com controle de concorrência e limite de cota
    # A cota padrão da Indexing API é de 200 requisições por dia por projeto
    for i, url in enumerate(urls[:200], start=1):
        payload = {
            "url": url,
            "type": "URL_UPDATED"  # Força o status de atualização/inserção imediata
        }
        
        try:
            response = session.post(API_ENDPOINT, json=payload)
            
            if response.status_code == 200:
                print(f"[{i}/200] Sucesso: {url}")
            else:
                print(f"[-] Erro na URL {url} | Status: {response.status_code} | Resposta: {response.text}")
                
        except Exception as e:
            print(f"[-] Falha ao processar {url}: {e}")
        
        # Pequena pausa de 1.5 segundos entre requisições para evitar HTTP 429 (Too Many Requests)
        time.sleep(1.5)

if __name__ == "__main__":
    main()