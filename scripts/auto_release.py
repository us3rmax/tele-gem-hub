"""
auto_release.py — Canais18 Automated SEO Pipeline
==================================================
Roda diariamente via GitHub Actions. Faz:
1. Corrige descriptions vazias/curtas/longas dos grupos hidden
2. Libera 2 grupos por dia (hidden→visible, noindex→index)
3. Atualiza thumbnails de grupos sem foto
4. Verifica links quebrados em grupos visíveis

Dependências: supabase, httpx, python-dotenv
API: OpenRouter (grátis) via OPENROUTER_API_KEY
"""

import os
import sys
import time
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

load_dotenv()

# --- CONFIG ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
RELEASE_PER_DAY = 2  # Grupos liberados por dia

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- KEYWORDS POR CATEGORIA ---
CATEGORY_KEYWORDS = {
    "putaria": "grupos de putaria no telegram",
    "porno": "canais porno telegram",
    "xxx": "canais xxx no telegram",
    "novinhas": "grupos de novinhas telegram",
    "amadoras": "amadoras brasileiras no telegram",
    "vazados": "canais de vazados telegram",
    "onlyfans": "onlyfans no telegram grátis",
    "privacy": "modelos privacy no telegram",
    "celebridades": "celebridades no telegram",
    "gay": "grupos gay no telegram",
    "casadas": "casadas no telegram",
    "trans": "canais trans no telegram",
    "hentai": "canais hentai telegram",
    "fetiche": "grupos fetiche no telegram",
    "latina": "latinas no telegram",
    "asiaticas": "asiáticas no telegram",
    "bbw": "canais bbw no telegram",
    "coroas": "coroas no telegram",
    "bdsm": "grupos bdsm telegram",
    "cornos": "canais cornos telegram",
    "negras": "canais negras no telegram",
    "lesbicas": "canais lésbicas telegram",
    "acompanhantes": "acompanhantes no telegram",
    "interracial": "interracial no telegram",
    "amizade": "grupos telegram comunidade",
    "geral": "canais telegram 18+",
    "Putaria": "grupos de putaria no telegram",
    "Novinhas": "grupos de novinhas telegram",
    "Vazados": "canais de vazados telegram",
}


# --- LLM: Generate SEO Description ---
def generate_description(group_name: str, category: str, current_desc: str = "") -> str:
    """Gera description SEO via OpenRouter (grátis)."""
    keyword = CATEGORY_KEYWORDS.get(category, "canais telegram 18+")
    clean_name = group_name.strip("@").strip()

    prompt = f"""Crie uma META DESCRIPTION para SEO (site adulto brasileiro, canais18.com).

GRUPO: {clean_name}
CATEGORIA: {category}
KEYWORD OBRIGATÓRIA: "{keyword}"
DESCRIÇÃO ATUAL: {current_desc[:200] if current_desc and current_desc.strip() else "(vazia)"}

REGRAS:
- Entre 130 e 155 caracteres
- Incluir a keyword "{keyword}"
- Mencionar "{clean_name}" naturalmente
- Terminar com: "Acesse grátis em canais18.com"
- Sem emojis, português brasileiro
- Retorne APENAS a description, sem aspas"""

    try:
        resp = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://canais18.com",
            },
            json={
                "model": "openrouter/free",
                "max_tokens": 80,
                "temperature": 0.7,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"].strip().strip('"').strip("'")

        if 80 <= len(text) <= 155:
            return text
        if len(text) > 155:
            return text[:152] + "..."
    except Exception as e:
        print(f"      ⚠️ Erro API: {e}")

    return generate_fallback(group_name, category)


def generate_fallback(group_name: str, category: str) -> str:
    """Fallback quando API falha."""
    keyword = CATEGORY_KEYWORDS.get(category, "canais telegram 18+")
    clean_name = group_name.strip("@").strip()
    templates = [
        f"{clean_name} - {keyword}. Conteúdo verificado. Acesse grátis em canais18.com",
        f"Confira {clean_name}: {keyword} com membros ativos. Entre agora em canais18.com",
        f"{clean_name} traz {keyword} verificado. Confira em canais18.com",
    ]
    desc = templates[hash(group_name) % len(templates)]
    if len(desc) > 155:
        desc = desc[:152] + "..."
    return desc


# --- FASE 1: Corrigir descriptions ---
def fix_descriptions_batch(batch_size=20):
    """Corrige descriptions de grupos hidden com problemas."""
    print("\n📝 Fase 1: Corrigindo descriptions...")

    # Pegar grupos hidden com description vazia
    res = supabase.table("groups").select("id, name, category").eq("hidden", True).eq("description", "").limit(batch_size).execute()
    empty = res.data

    if empty:
        print(f"   {len(empty)} descriptions vazias")
        for g in empty:
            desc = generate_description(g["name"], g["category"])
            supabase.table("groups").update({"description": desc}).eq("id", g["id"]).execute()
            print(f"     ✅ {g['name'][:40]}")
            time.sleep(3.5)

    # Pegar grupos hidden com description muito curta
    res = supabase.table("groups").select("id, name, category, description").eq("hidden", True).limit(500).execute()
    short = [g for g in res.data if g.get("description") and 0 < len(g["description"]) < 50][:batch_size]

    if short:
        print(f"   {len(short)} descriptions muito curtas")
        for g in short:
            desc = generate_description(g["name"], g["category"], g["description"])
            supabase.table("groups").update({"description": desc}).eq("id", g["id"]).execute()
            print(f"     ✅ {g['name'][:40]}")
            time.sleep(3.5)

    # Pegar grupos hidden com description muito longa
    long = [g for g in res.data if g.get("description") and len(g["description"]) > 155][:batch_size]

    if long:
        print(f"   {len(long)} descriptions muito longas")
        for g in long:
            desc = generate_description(g["name"], g["category"], g["description"])
            supabase.table("groups").update({"description": desc}).eq("id", g["id"]).execute()
            print(f"     ✅ {g['name'][:40]}")
            time.sleep(3.5)


# --- FASE 2: Liberar grupos ---
def release_groups(count=RELEASE_PER_DAY):
    """Libera grupos hidden que estão prontos (description + thumbnail)."""
    print(f"\n🚀 Fase 2: Liberando {count} grupos...")

    # Critérios: hidden=true, tem description ok (50-155 chars), tem thumbnail, não broken
    res = supabase.table("groups").select("id, name, category, description, thumbnail_url").eq("hidden", True).neq("description", "").neq("thumbnail_url", None).limit(100).execute()

    candidates = [g for g in res.data if g.get("description") and 50 <= len(g["description"]) <= 155]

    if not candidates:
        print("   Nenhum grupo pronto para liberar (precisam description + thumbnail)")
        return 0

    released = 0
    for g in candidates[:count]:
        supabase.table("groups").update({
            "hidden": False,
            "is_indexed": True
        }).eq("id", g["id"]).execute()
        released += 1
        print(f"   ✅ Liberado: {g['name'][:50]} ({g['category']})")

    return released


# --- FASE 3: Verificar links quebrados ---
def check_broken_links(batch_size=50):
    """Verifica se grupos visíveis ainda respondem (links quebrados)."""
    print(f"\n🔍 Fase 3: Verificando links quebrados ({batch_size} grupos)...")

    res = supabase.table("groups").select("id, name, telegram_link").eq("hidden", False).neq("broken", True).limit(batch_size).execute()
    groups = res.data

    if not groups:
        print("   Nenhum grupo para verificar.")
        return 0

    broken_count = 0
    for g in groups:
        link = g.get("telegram_link", "")
        if not link or "+" in link:
            continue

        username = link.split("t.me/")[-1].strip()
        try:
            resp = httpx.head(f"https://t.me/{username}", timeout=5, follow_redirects=True)
            if resp.status_code in (404, 410):
                supabase.table("groups").update({"broken": True}).eq("id", g["id"]).execute()
                broken_count += 1
                print(f"   ❌ Quebrado: {g['name'][:40]}")
        except:
            pass
        time.sleep(0.2)

    print(f"   {broken_count} links quebrados encontrados")
    return broken_count


# --- FASE 4: Desmarcar broken que voltaram ---
def unmark_fixed_links(batch_size=20):
    """Remove flag broken de grupos que voltaram a funcionar."""
    print(f"\n🔧 Fase 4: Verificando links que voltaram...")

    res = supabase.table("groups").select("id, name, telegram_link").eq("broken", True).limit(batch_size).execute()
    groups = res.data

    if not groups:
        print("   Nenhum grupo broken para verificar.")
        return 0

    fixed_count = 0
    for g in groups:
        link = g.get("telegram_link", "")
        if not link or "+" in link:
            continue

        username = link.split("t.me/")[-1].strip()
        try:
            resp = httpx.head(f"https://t.me/{username}", timeout=5, follow_redirects=True)
            if resp.status_code == 200:
                supabase.table("groups").update({"broken": False}).eq("id", g["id"]).execute()
                fixed_count += 1
                print(f"   ✅ Voltou: {g['name'][:40]}")
        except:
            pass
        time.sleep(0.2)

    print(f"   {fixed_count} links recuperados")
    return fixed_count


# --- MAIN ---
def main():
    print("=" * 60)
    print(f"🤖 Canais18 - Auto Release Pipeline")
    print(f"   Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    results = {
        "descriptions_fixed": 0,
        "groups_released": 0,
        "broken_found": 0,
        "links_fixed": 0,
    }

    # Fase 1
    fix_descriptions_batch(batch_size=20)

    # Fase 2
    results["groups_released"] = release_groups(RELEASE_PER_DAY)

    # Fase 3
    results["broken_found"] = check_broken_links(batch_size=50)

    # Fase 4
    results["links_fixed"] = unmark_fixed_links(batch_size=20)

    # Resumo
    print(f"\n{'=' * 60}")
    print(f"✅ Pipeline concluído!")
    print(f"   Grupos liberados: {results['groups_released']}")
    print(f"   Links quebrados: {results['broken_found']}")
    print(f"   Links recuperados: {results['links_fixed']}")
    print(f"{'=' * 60}")

    # Salvar log
    log = {
        "date": datetime.now().isoformat(),
        "released": results["groups_released"],
        "broken": results["broken_found"],
        "fixed": results["links_fixed"],
    }
    with open("/tmp/release_log.json", "w") as f:
        json.dump(log, f)


if __name__ == "__main__":
    main()
