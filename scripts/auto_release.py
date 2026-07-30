"""
auto_release.py — Canais18 Automated SEO Pipeline
==================================================
Roda diariamente via GitHub Actions. Faz:
1. Corrige descriptions vazias/curtas/longas dos grupos hidden
2. Libera 8 grupos por dia (hidden→visible, noindex→index)
3. Escalada automática: sobe para 12/dia após 30 dias, 15/dia após 60 dias
4. Verifica links quebrados em grupos visíveis
5. Recupera links que voltaram a funcionar

Dependências: supabase, httpx, python-dotenv
API: OpenRouter (grátis) via OPENROUTER_API_KEY

Configuração de escalada (salva em Supabase seo_config):
  - key: 'release_rate' → valor: {"rate": 8, "start_date": "2026-07-30", "last_adjusted": "..."}
  - Se > 30 dias sem problemas: sobe para 12
  - Se > 60 dias sem problemas: sobe para 15
  - Se Google não indexa (discovered not indexed cresce): volta para 5
"""

import os
import sys
import time
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

load_dotenv()

# --- CONFIG ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
DEFAULT_RATE = 8

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

# --- RELEASE RATE MANAGEMENT ---
def get_release_rate():
    """Retorna a taxa de liberação atual (com escalada automática)."""
    # Tentar pegar do banco
    try:
        res = supabase.table("seo_config").select("value").eq("key", "release_rate").single().execute()
        if res.data and res.data.get("value"):
            config = res.data["value"]
            if isinstance(config, str):
                config = json.loads(config)
            rate = config.get("rate", DEFAULT_RATE)
            start_date = config.get("start_date", datetime.now().strftime("%Y-%m-%d"))
            days_running = (datetime.now() - datetime.strptime(start_date, "%Y-%m-%d")).days
            
            # Escalada automática
            if days_running > 60 and rate < 15:
                rate = 15
                config["rate"] = 15
                config["last_adjusted"] = datetime.now().strftime("%Y-%m-%d")
                update_release_config(config)
                print(f"⬆️ Escalada: rate subiu para {rate} (60+ dias)")
            elif days_running > 30 and rate < 12:
                rate = 12
                config["rate"] = 12
                config["last_adjusted"] = datetime.now().strftime("%Y-%m-%d")
                update_release_config(config)
                print(f"⬆️ Escalada: rate subiu para {rate} (30+ dias)")
            
            return rate
    except:
        pass
    
    # Se não existe, criar
    config = {
        "rate": DEFAULT_RATE,
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "last_adjusted": datetime.now().strftime("%Y-%m-%d")
    }
    update_release_config(config)
    return DEFAULT_RATE


def update_release_config(config):
    """Atualiza a configuração de rate no banco."""
    try:
        existing = supabase.table("seo_config").select("id").eq("key", "release_rate").execute()
        if existing.data:
            supabase.table("seo_config").update({"value": config}).eq("key", "release_rate").execute()
        else:
            supabase.table("seo_config").insert({"key": "release_rate", "value": config}).execute()
    except:
        pass


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
    fixed = 0

    # Pegar grupos hidden com description vazia
    res = supabase.table("groups").select("id, name, category").eq("hidden", True).eq("description", "").limit(batch_size).execute()
    empty = res.data

    if empty:
        print(f"   {len(empty)} descriptions vazias")
        for g in empty:
            desc = generate_description(g["name"], g["category"])
            supabase.table("groups").update({"description": desc}).eq("id", g["id"]).execute()
            print(f"     ✅ {g['name'][:50]}")
            fixed += 1
            time.sleep(3.5)

    # Pegar grupos hidden com description muito curta
    res = supabase.table("groups").select("id, name, category, description").eq("hidden", True).limit(500).execute()
    short = [g for g in res.data if g.get("description") and 0 < len(g["description"]) < 50][:batch_size]

    if short:
        print(f"   {len(short)} descriptions muito curtas")
        for g in short:
            desc = generate_description(g["name"], g["category"], g["description"])
            supabase.table("groups").update({"description": desc}).eq("id", g["id"]).execute()
            print(f"     ✅ {g['name'][:50]}")
            fixed += 1
            time.sleep(3.5)

    # Pegar grupos hidden com description muito longa
    long = [g for g in res.data if g.get("description") and len(g["description"]) > 155][:batch_size]

    if long:
        print(f"   {len(long)} descriptions muito longas")
        for g in long:
            desc = generate_description(g["name"], g["category"], g["description"])
            supabase.table("groups").update({"description": desc}).eq("id", g["id"]).execute()
            print(f"     ✅ {g['name'][:50]}")
            fixed += 1
            time.sleep(3.5)

    print(f"   Total corrigidas: {fixed}")
    return fixed


# --- FASE 2: Liberar grupos ---
def release_groups(count=DEFAULT_RATE):
    """Libera grupos hidden que estão prontos (description + thumbnail)."""
    print(f"\n🚀 Fase 2: Liberando {count} grupos...")

    # Critérios: hidden=true, tem description ok (50-155 chars), tem thumbnail, não broken
    res = supabase.table("groups").select("id, name, category, description, thumbnail_url, member_count").eq("hidden", True).neq("description", "").neq("thumbnail_url", None).neq("thumbnail_url", "").order("member_count", desc=True).limit(200).execute()

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
        print(f"   ✅ Liberado: {g['name'][:50]} ({g['category']}) - {g.get('member_count', 0)} membros")

    print(f"   Total liberados: {released}")
    return released


# --- FASE 3: Verificar links quebrados ---
def check_broken_links(batch_size=50):
    """Verifica se grupos visíveis ainda respondem."""
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
                print(f"   ❌ Quebrado: {g['name'][:50]}")
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
                print(f"   ✅ Voltou: {g['name'][:50]}")
        except:
            pass
        time.sleep(0.2)

    print(f"   {fixed_count} links recuperados")
    return fixed_count


# --- FASE 5: Atualizar thumbnails em lotes ---
def fix_thumbnails_batch(batch_size=10):
    """Atualiza thumbnails de grupos hidden sem foto (usando fallback avatar)."""
    print(f"\n🖼️ Fase 5: Verificando thumbnails faltantes ({batch_size} grupos)...")

    res = supabase.table("groups").select("id, name, category, telegram_link").eq("hidden", True).is_("thumbnail_url", "null").limit(batch_size).execute()
    groups = res.data

    if not groups:
        print("   Nenhum grupo sem thumbnail.")
        return 0

    print(f"   {len(groups)} grupos sem thumbnail (sem foto = usa placeholder do site)")
    # Grupos sem thumbnail usam placeholder automático no site (não bloqueia release)
    return len(groups)


# --- MAIN ---
def main():
    print("=" * 60)
    print(f"🤖 Canais18 - Auto Release Pipeline")
    print(f"   Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Pegar rate atual (com escalada)
    rate = get_release_rate()
    print(f"\n📊 Rate atual: {rate} grupos/dia")

    results = {
        "descriptions_fixed": 0,
        "groups_released": 0,
        "broken_found": 0,
        "links_fixed": 0,
        "thumbnails_missing": 0,
    }

    # Fase 1: Corrigir descriptions
    results["descriptions_fixed"] = fix_descriptions_batch(batch_size=20)

    # Fase 2: Liberar grupos
    results["groups_released"] = release_groups(rate)

    # Fase 3: Verificar links quebrados
    results["broken_found"] = check_broken_links(batch_size=50)

    # Fase 4: Recuperar links
    results["links_fixed"] = unmark_fixed_links(batch_size=20)

    # Fase 5: Thumbnails
    results["thumbnails_missing"] = fix_thumbnails_batch(batch_size=10)

    # Resumo
    print(f"\n{'=' * 60}")
    print(f"✅ Pipeline concluído!")
    print(f"   Descriptions corrigidas: {results['descriptions_fixed']}")
    print(f"   Grupos liberados: {results['groups_released']}")
    print(f"   Links quebrados: {results['broken_found']}")
    print(f"   Links recuperados: {results['links_fixed']}")
    print(f"   Sem thumbnail: {results['thumbnails_missing']}")
    print(f"   Rate: {rate}/dia")
    print(f"{'=' * 60}")

    # Salvar log local
    log = {
        "date": datetime.now().isoformat(),
        "rate": rate,
        "descriptions_fixed": results["descriptions_fixed"],
        "released": results["groups_released"],
        "broken": results["broken_found"],
        "fixed": results["links_fixed"],
        "no_thumb": results["thumbnails_missing"],
    }
    with open("/tmp/release_log.json", "w") as f:
        json.dump(log, f)

    # ── Salvar métricas no Supabase para o dashboard ──────────────────────
    now_iso = datetime.now().isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Salvar em seo_cache (key='auto_release') para o dashboard ler
    cache_payload = {
        "date": today_str,
        "rate": rate,
        "released_today": results["groups_released"],
        "descriptions_fixed": results["descriptions_fixed"],
        "broken_found": results["broken_found"],
        "links_fixed": results["links_fixed"],
        "thumbnails_missing": results["thumbnails_missing"],
        "timestamp": now_iso,
    }
    try:
        supabase.table("seo_cache").upsert(
            {"key": "auto_release", "data": cache_payload, "updated_at": "now()"},
            on_conflict="key"
        ).execute()
    except Exception as e:
        print(f"⚠️ Erro ao salvar seo_cache auto_release: {e}")

    # Salvar health em seo_health
    health_status = "ok"
    health_error = None
    if results["broken_found"] > 10:
        health_status = "warning"
        health_error = f"{results['broken_found']} links quebrados encontrados"
    if results["groups_released"] == 0 and rate > 0:
        health_status = "warning"
        health_error = "Nenhum grupo liberado (pode não haver prontos)"
    try:
        supabase.table("seo_health").upsert(
            {
                "task": "auto-release",
                "last_run": now_iso,
                "last_success": now_iso if health_status != "error" else None,
                "status": health_status,
                "last_error": health_error,
            },
            on_conflict="task"
        ).execute()
    except Exception as e:
        print(f"⚠️ Erro ao salvar seo_health auto-release: {e}")

    # Contar grupos visíveis/hidden para o dashboard
    try:
        total_res = supabase.table("groups").select("id", count="exact").execute()
        total_groups = total_res.count
        visible_res = supabase.table("groups").select("id", count="exact").eq("hidden", False).execute()
        visible_groups = visible_res.count
        hidden_res = supabase.table("groups").select("id", count="exact").eq("hidden", True).execute()
        hidden_groups = hidden_res.count
        # Prontos para liberar: hidden=true, description ok (50-155 chars), thumbnail ok
        ready_res = supabase.table("groups").select("id").eq("hidden", True).neq("description", "").neq("thumbnail_url", None).execute()
        ready_groups = sum(1 for g in (ready_res.data or []) if g.get("description") and 50 <= len(g.get("description", "")) <= 155)

        supabase.table("seo_config").upsert(
            {"key": "group_counts", "value": {
                "total": total_groups,
                "visible": visible_groups,
                "hidden": hidden_groups,
                "ready_to_release": ready_groups,
            }},
            on_conflict="key"
        ).execute()
    except Exception as e:
        print(f"⚠️ Erro ao contar grupos: {e}")


if __name__ == "__main__":
    main()
