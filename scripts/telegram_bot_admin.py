import os
import asyncio
import logging
from telethon import TelegramClient, events
from supabase import create_client, Client

# --- CONFIGURAÇÕES ---
# Pegue seu API_ID e API_HASH em https://my.telegram.org
API_ID = 'SEU_API_ID'
API_HASH = 'SEU_API_HASH'
BOT_TOKEN = '7781984305:AAFR3529ref_uM2wmjUQkX7v5vYR9Gwx0Fg'

# Supabase (As chaves serão lidas do ambiente ou você pode colocar aqui)
SUPABASE_URL = os.getenv("SUPABASE_URL", "SUA_URL_SUPABASE")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "SUA_KEY_SERVICE_ROLE")

# Inicializar Clientes
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
bot = TelegramClient('canais18_bot_session', API_ID, API_HASH).start(bot_token=BOT_TOKEN)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("🤖 Bot Canais18 iniciado e aguardando eventos...")

@bot.on(events.ChatAction)
async def handler(event):
    """Detecta quando o bot é adicionado a um novo grupo/canal"""
    if event.user_added and event.user_id == (await bot.get_me()).id:
        chat = await event.get_chat()
        chat_id = chat.id
        title = chat.title
        username = getattr(chat, 'username', None)
        invite_link = f"https://t.me/{username}" if username else "Link Privado"

        print(f"✅ Adicionado ao grupo: {title} ({chat_id})")

        # Salvar no Supabase
        try:
            data = {
                "chat_id": str(chat_id),
                "title": title,
                "invite_link": invite_link,
                "is_active": True
            }
            # Upsert para não duplicar
            supabase.table("bot_groups").upsert(data, on_conflict="chat_id").execute()
            print(f"💾 Grupo {title} salvo no banco de dados!")
            
            # Mensagem de boas-vindas no grupo
            await bot.send_message(chat_id, "✅ **Bot Canais18 Ativado!**\n\nEste grupo agora faz parte da nossa rede de divulgação. Mantenha o bot como admin para garantir sua permanência no site.")
            
        except Exception as e:
            print(f"❌ Erro ao salvar no banco: {e}")

@bot.on(events.NewMessage(pattern='/start'))
async def start(event):
    if event.is_private:
        await event.respond("👋 Olá! Eu sou o bot do **Canais18**.\n\nMe adicione como administrador no seu grupo para que ele seja validado e apareça no nosso site!")

async def main():
    print("🚀 Bot rodando...")
    await bot.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
