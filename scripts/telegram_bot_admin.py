import asyncio
import logging
import re
from telethon import TelegramClient, events, Button, types
from supabase import create_client

# --- CONFIGURAÇÕES ---
API_ID = 28886261
API_HASH = '1c78f2274ccbbd3588eb53159d107155'
BOT_TOKEN = '8512413789:AAFrRag0MXP748MJxodwf8bFWulOycWdjbM'

SUPABASE_URL = "https://lymjjozpdsdoloahsyey.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4ODEwNCwiZXhwIjoyMDg2NTY0MTA0fQ.RfJ7MHacsQZrIL_yG84lVcl2qDNF6xeriHomO1eRG0g"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar bot com parse_mode=None para evitar qualquer interferência automática no texto
bot = TelegramClient('canais18_bot_session', API_ID, API_HASH)

# --- ESTADOS ---
user_states = {}

# --- MENU PRINCIPAL ---
MAIN_MENU_REPLY = [
    [Button.text("📨 Criar Postagem", resize=True), Button.text("📊 Estatísticas")],
    [Button.text("⚙️ Configurações"), Button.text("❓ Ajuda")]
]

# --- UTILITÁRIOS ---
def parse_inline_buttons(text):
    if not text: return None
    final_rows = []
    lines = text.split('\n')
    for line in lines:
        row = []
        parts = line.split('&&')
        for p in parts:
            match = re.search(r'(.+?)(?:\s*->\s*|\s*--\s*|\s*-\s*)(https?://\S+)', p)
            if match:
                label = match.group(1).strip()
                url = match.group(2).strip().replace(" ", "")
                row.append(Button.url(label, url))
        if row: final_rows.append(row)
    return final_rows if final_rows else None

async def send_broadcast_message(target_id, state, buttons=None):
    """
    Lógica de Elite: Envia a mensagem preservando CustomEmoji (Premium).
    Em vez de reconstruir o texto, usamos os atributos nativos da mensagem capturada.
    """
    # 1. Recuperar a mensagem original do cache do Telegram para garantir acesso às entidades CustomEmoji
    orig_msg = await bot.get_messages(state['chat_id'], ids=state['msg_id'])
    
    # 2. Definir texto e entidades finais
    if state.get('no_caption'):
        final_text = ""
        final_entities = None
    elif state.get('custom_caption_msg_id'):
        # Se o usuário enviou uma legenda customizada, pegamos ela como um objeto Message
        cap_msg = await bot.get_messages(state['chat_id'], ids=state['custom_caption_msg_id'])
        final_text = cap_msg.message
        final_entities = cap_msg.entities
    else:
        # Caso contrário, usamos o texto e entidades da mensagem de mídia original
        final_text = orig_msg.message
        final_entities = orig_msg.entities

    # 3. Envio direto via Telethon com parse_mode=None (Essencial para Emojis Premium)
    return await bot.send_message(
        target_id,
        final_text,
        file=orig_msg.media,
        formatting_entities=final_entities,
        buttons=buttons,
        silent=not state['settings']['notify'],
        link_preview=state['settings']['preview'],
        parse_mode=None # Garante que o Telegram use as entidades brutas (CustomEmoji inclusive)
    )

# --- INTERFACES ---

async def show_settings(event, user_id):
    state = user_states[user_id]
    s = state['settings']
    text = (
        "✉️ **Criar posts • Guia**\n\n"
        "A partir deste menu, você pode escolher as configurações de postagem.\n\n"
        "• Pressione os **botões à esquerda** para saber como funcionam as várias configurações de postagem.\n"
        "• Pressione os **botões à direita** para alterar cada configuração."
    )
    buttons = [
        [Button.inline("➡️ Próximo", b"nav_content")],
        [Button.inline("🔔 Notificações", b"info"), Button.inline("✅ SIM" if s['notify'] else "❌ NÃO", b"tog_notif")],
        [Button.inline("🏷️ Visualização do link", b"info"), Button.inline("✅ SIM" if s['preview'] else "❌ NÃO", b"tog_preview")],
        [Button.inline("📑 Formatação", b"info"), Button.inline("🟦 Telegram", b"info")],
        [Button.inline("🔒 Protegido", b"info"), Button.inline("✅ SIM" if s['protected'] else "❌ NÃO", b"tog_protect")],
        [Button.inline("🏠 Menu", b"cancel"), Button.inline("⬅️ Voltar", b"cancel")]
    ]
    await (event.edit(text, buttons=buttons) if hasattr(event, 'data') else event.respond(text, buttons=buttons))

async def show_content_input(event, user_id):
    text = "**Envie a mensagem de postagem ou mídia**\n_💡 Envie aqui o conteúdo com Emojis Premium e formatação._"
    buttons = [[Button.inline("🏠 Menu", b"cancel"), Button.inline("⬅️ Voltar", b"nav_settings")]]
    await event.edit(text, buttons=buttons)

async def show_caption_input(event, user_id):
    text = "**Envie a legenda da mídia**\n_💡 Preserve os Emojis Premium aqui também._"
    buttons = [[Button.inline("🚫 Sem legenda", b"set_no_caption")], [Button.inline("🏠 Menu", b"cancel")]]
    await event.respond(text, buttons=buttons)

async def show_buttons_input(event, user_id):
    text = "**Defina os botões**\nUse o formato: `Texto - Link`"
    buttons = [[Button.inline("🚫 Sem botões", b"nav_final")], [Button.inline("🏠 Menu", b"cancel")]]
    await event.respond(text, buttons=buttons)

async def show_final_menu(event, user_id):
    state = user_states[user_id]
    await event.respond("👁️ **PRÉ-VISUALIZAÇÃO:**")
    try:
        await send_broadcast_message(event.chat_id, state, buttons=parse_inline_buttons(state['buttons_raw']))
    except Exception as e:
        await event.respond(f"❌ Erro no Preview: {e}")

    buttons = [
        [Button.inline("💾 Salvar Postagem", b"info"), Button.inline("👤 Enviar postagem ➡️", b"send_now")],
        [Button.inline("📌 Fixar postagem", b"info"), Button.inline("✅ SIM" if state['settings']['pin'] else "❌ NÃO", b"tog_pin")],
        [Button.inline("🏠 Menu", b"cancel")]
    ]
    await event.respond("Escolha uma ação final:", buttons=buttons)

# --- HANDLERS ---

@bot.on(events.NewMessage(pattern='/start'))
async def start(event):
    await event.respond("👋 **Painel Admin Canais18**", buttons=MAIN_MENU_REPLY)

@bot.on(events.NewMessage(func=lambda e: e.text == "📨 Criar Postagem"))
async def create_post(event):
    user_id = event.sender_id
    user_states[user_id] = {
        'step': 'SETTINGS', 'chat_id': event.chat_id,
        'settings': {'notify': True, 'preview': True, 'protected': False, 'pin': False},
        'msg_id': None, 'custom_caption_msg_id': None, 'no_caption': False, 'buttons_raw': None
    }
    await show_settings(event, user_id)

@bot.on(events.NewMessage)
async def message_handler(event):
    if not event.is_private or event.text in ["📨 Criar Postagem", "📊 Estatísticas"]: return
    user_id = event.sender_id
    state = user_states.get(user_id)
    if not state: return

    if state['step'] == 'AWAIT_CONTENT':
        state['msg_id'] = event.id
        state['step'] = 'AWAIT_CAPTION' if event.media else 'AWAIT_BUTTONS'
        await (show_caption_input(event, user_id) if event.media else show_buttons_input(event, user_id))
    
    elif state['step'] == 'AWAIT_CAPTION':
        state['custom_caption_msg_id'] = event.id
        state['step'] = 'AWAIT_BUTTONS'
        await show_buttons_input(event, user_id)

    elif state['step'] == 'AWAIT_BUTTONS':
        state['buttons_raw'] = event.text
        state['step'] = 'FINAL_MENU'
        await show_final_menu(event, user_id)

@bot.on(events.CallbackQuery)
async def callback_handler(event):
    user_id = event.sender_id
    data = event.data
    state = user_states.get(user_id)
    if not state: return

    if data == b"nav_content": state['step'] = 'AWAIT_CONTENT'; await show_content_input(event, user_id)
    elif data == b"set_no_caption": state['no_caption'] = True; state['step'] = 'AWAIT_BUTTONS'; await show_buttons_input(event, user_id)
    elif data == b"nav_final": state['step'] = 'FINAL_MENU'; await show_final_menu(event, user_id)
    elif data == b"cancel": user_states.pop(user_id, None); await event.respond("Cancelado.", buttons=MAIN_MENU_REPLY)
    elif data == b"tog_pin": state['settings']['pin'] = not state['settings']['pin']; await show_final_menu(event, user_id)
    
    elif data == b"send_now":
        await event.edit("🚀 **Enviando...**")
        res = supabase.table("bot_groups").select("chat_id").eq("is_active", True).execute()
        success = 0
        btns = parse_inline_buttons(state['buttons_raw'])
        for g in (res.data or []):
            try:
                sent = await send_broadcast_message(int(g['chat_id']), state, buttons=btns)
                if state['settings']['pin']: await bot.pin_message(int(g['chat_id']), sent.id)
                success += 1
                await asyncio.sleep(2)
            except: pass
        await event.respond(f"✅ Enviado para {success} grupos.", buttons=MAIN_MENU_REPLY)
        user_states.pop(user_id, None)

async def main():
    await bot.start(bot_token=BOT_TOKEN)
    await bot.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
