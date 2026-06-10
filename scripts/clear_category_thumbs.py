import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clear_thumbs():
    print("Iniciando limpeza de miniaturas que usam capas de categorias...")
    try:
        # 1. Pegar todos os grupos
        res = supabase.table("groups").select("id, name, category, thumbnail_url").execute()
        groups = res.data
        
        cleared_count = 0
        for g in groups:
            thumb = g.get('thumbnail_url', '')
            cat = g.get('category', '').lower()
            
            if not thumb:
                continue
                
            # Identificar se a thumb é uma capa de categoria
            # Padrões comuns observados: /thumbnails/gruposdotelegram/{categoria}.jpg
            # Ou apenas conter o nome da categoria como nome do arquivo
            is_category_cover = False
            
            # Lista de slugs de categorias conhecidas
            categories = [
                "novinhas", "amadoras", "cornos", "onlyfans", "vazados", 
                "lesbicas", "pack", "putaria", "geral", "trans", "gay", 
                "fetiche", "casadas", "celebridades", "asiaticas", "bdsm", 
                "bbw", "coroas"
            ]
            
            for c in categories:
                if f"/{c}.jpg" in thumb.lower() or f"/{c}.png" in thumb.lower():
                    is_category_cover = True
                    break
            
            if is_category_cover:
                print(f"🧹 Limpando thumb de categoria do grupo: {g['name']} (Categoria: {g['category']})")
                supabase.table("groups").update({"thumbnail_url": None}).eq("id", g['id']).execute()
                cleared_count += 1
                
        print(f"\nConcluído! {cleared_count} miniaturas de categoria foram removidas dos grupos.")
        print("Agora esses grupos usarão o placeholder padrão do frontend.")
        
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    clear_thumbs()
