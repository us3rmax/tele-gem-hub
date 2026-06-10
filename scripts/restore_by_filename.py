import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '_', text) # Note: some files use underscores
    return text.strip('_')

def restore():
    print("Iniciando restauração por nome de arquivo em 'group-photos'...")
    try:
        # 1. Listar arquivos no group-photos
        files_res = supabase.storage.from_("group-photos").list("", {"limit": 1000})
        # Criar mapa: nome_limpo -> nome_arquivo
        file_map = {}
        for f in files_res:
            fname = f['name']
            if '.' in fname:
                clean_name = fname.rsplit('_', 1)[0].lower() # Remove o sufixo aleatório se houver
                file_map[clean_name] = fname

        # 2. Pegar grupos bugados
        groups_res = supabase.table("groups").select("id, name, category, thumbnail_url").execute()
        groups = groups_res.data
        
        fixed_count = 0
        for g in groups:
            name = g['name']
            slug = slugify(name)
            thumb = g.get('thumbnail_url', '')
            cat = g.get('category', '').lower()
            
            is_bugged = not thumb or f"/{cat}.jpg" in thumb.lower() or f"/{cat}.png" in thumb.lower()
            
            if is_bugged:
                # Tentar encontrar por slug ou nome
                match_file = None
                if slug in file_map:
                    match_file = file_map[slug]
                elif name.lower().replace(' ', '_') in file_map:
                    match_file = file_map[name.lower().replace(' ', '_')]
                
                if match_file:
                    new_url = f"{SUPABASE_URL}/storage/v1/object/public/group-photos/{match_file}"
                    print(f"✅ Encontrado: {name} -> {new_url}")
                    supabase.table("groups").update({"thumbnail_url": new_url}).eq("id", g['id']).execute()
                    fixed_count += 1

        print(f"\nConcluído! {fixed_count} miniaturas restauradas.")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    restore()
