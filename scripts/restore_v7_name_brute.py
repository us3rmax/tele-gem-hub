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
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def restore():
    print("Iniciando restauração por nome bruto (V7)...")
    try:
        # 1. Pegar grupos bugados
        groups_res = supabase.table("groups").select("id, name, category, thumbnail_url").execute()
        bugged_groups = [g for g in groups_res.data if not g['thumbnail_url'] or f"/{g['category'].lower()}.jpg" in g['thumbnail_url'].lower()]
        
        # 2. Mapear arquivos no bucket
        print("Mapeando arquivos...")
        all_files = []
        for folder in ["", "gruposdotelegram"]:
            offset = 0
            while True:
                res = supabase.storage.from_("thumbnails").list(folder, {"limit": 1000, "offset": offset})
                if not res: break
                for f in res:
                    f['folder'] = folder
                    all_files.append(f)
                if len(res) < 1000: break
                offset += 1000
        
        # 3. Cruzamento por nome
        fixed = 0
        for g in bugged_groups:
            name_slug = slugify(g['name'])
            for f in all_files:
                fname = f['name'].lower()
                if name_slug in fname and len(name_slug) > 5:
                    path = f"{f['folder']}/{f['name']}" if f['folder'] else f['name']
                    new_url = supabase.storage.from_("thumbnails").get_public_url(path)
                    print(f"✅ Match por nome: {g['name']} -> {new_url}")
                    supabase.table("groups").update({"thumbnail_url": new_url}).eq("id", g['id']).execute()
                    fixed += 1
                    break
                    
        print(f"\nConcluído! {fixed} miniaturas restauradas via Name match.")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    restore()
