import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"Erro: Credenciais incompletas. URL: {SUPABASE_URL}, KEY: {'Presente' if SUPABASE_KEY else 'Ausente'}")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_samples():
    print("Verificando amostra de grupos e arquivos...")
    
    # 1. Pegar 5 grupos que usam capa de categoria
    response = supabase.table("groups").select("id, name, category, thumbnail_url").limit(100).execute()
    groups = response.data
    
    bugged_groups = []
    for g in groups:
        thumb = g.get('thumbnail_url', '')
        cat = g.get('category', '').lower()
        if cat and (f"/{cat}.jpg" in thumb.lower() or f"/{cat}.png" in thumb.lower()):
            bugged_groups.append(g)
            if len(bugged_groups) >= 5:
                break
    
    if not bugged_groups:
        print("Não encontrei grupos com o padrão de bug nas primeiras 100 linhas.")
        return

    print(f"Encontrados {len(bugged_groups)} grupos bugados para teste:")
    for g in bugged_groups:
        print(f"- ID: {g['id']} | Nome: {g['name']} | Thumb Atual: {g['thumbnail_url']}")

    # 2. Verificar se esses IDs existem no storage (thumbnails ou group-photos)
    print("\nBuscando arquivos correspondentes no Storage...")
    for g in bugged_groups:
        gid = g['id']
        found = False
        
        # Tentar em 'thumbnails' raiz
        res = supabase.storage.from_("thumbnails").list("", {"search": gid})
        if res:
            print(f"✅ Encontrado em thumbnails/: {[f['name'] for f in res]}")
            found = True
            
        # Tentar em 'thumbnails/gruposdotelegram'
        res = supabase.storage.from_("thumbnails").list("gruposdotelegram", {"search": gid})
        if res:
            print(f"✅ Encontrado em thumbnails/gruposdotelegram/: {[f['name'] for f in res]}")
            found = True
            
        # Tentar em 'group-photos'
        res = supabase.storage.from_("group-photos").list("", {"search": gid})
        if res:
            print(f"✅ Encontrado em group-photos/: {[f['name'] for f in res]}")
            found = True
            
        if not found:
            print(f"❌ Nenhum arquivo encontrado para o ID {gid}")

if __name__ == "__main__":
    check_samples()
