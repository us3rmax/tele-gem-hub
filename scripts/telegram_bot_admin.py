import asyncio
import logging
from telethon import TelegramClient, events
from supabase import create_client

# --- CONFIGURAÇÕES DO TELEGRAM ---
API_ID = 28886261
API_HASH = '1c78f2274ccbbd3588eb53159d107155'
BOT_TOKEN = '8512413789:AAFrRag0MXP748MJxodwf8bFWulOycWdjbM'

# --- CONFIGURAÇÕES DO SUPABASE ---
SUPABASE_URL = "https://lymjjozpdsdoloahsyey.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4ODEwNCwiZXhwIjoyMDg2NTY0MTA0fQ.RfJ7MHacsQZrIL_yG84lVcl2qDNF6xeriHomO1eRG0g"

# Inicializar cliente Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criar o cliente do bot sem iniciar imediatamente para evitar erro de loop
bot = TelegramClient('canais18_bot_session', API_ID, API_HASH)

@bot.on(events.ChatAction)
async def handler(event):
    """Detecta quando o bot é adicionado a um novo grupo/canal"""
    try:
        me = await bot.get_me()
        if event.user_added and event.user_id == me.id:
            chat = await event.get_chat()
            chat_id = str(chat.id)
            title = chat.title
            username = getattr(chat, 'username', None)
            invite_link = f"https://t.me/{username}" if username else "Link Privado"

            print(f"✅ Adicionado ao grupo: {title} ({chat_id})")

            # Salvar no Supabase
            data = {
                "chat_id": chat_id,
                "title": title,
                "invite_link": invite_link,
                "is_active": True
            }
            supabase.table("bot_groups").upsert(data, on_conflict="chat_id").execute()
            print(f"💾 Grupo {title} salvo no banco de dados!")
            
            # Mensagem de boas-vindas
            await bot.send_message(chat.id, "✅ **Bot Canais18 Ativado!**\n\nEste grupo agora faz parte da nossa rede de divulgação. Mantenha o bot como admin para garantir sua permanência no site.")
    except Exception as e:
        print(f"❌ Erro no evento: {e}")

@bot.on(events.NewMessage(pattern='/start'))
async def start(event):
    if event.is_private:
        await event.respond("👋 Olá! Eu sou o bot do **Canais18**.\n\nMe adicione como administrador no seu grupo para que ele seja validado e apareça no nosso site!")

async def main():
    print("🤖 Iniciando Bot Canais18...")
    await bot.start(bot_token=BOT_TOKEN)
    print("🚀 Bot rodando e aguardando eventos...")
    await bot.run_until_disconnected()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBot parado pelo usuário.")
    except Exception as e:
        print(f"💥 Erro fatal: {e}")
