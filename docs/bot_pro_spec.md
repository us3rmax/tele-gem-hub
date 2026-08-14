# Especificação Técnica: Canais18 Bot Pro (Inspirado no ChannelHelp)

## 1. Arquitetura de Estados (FSM)
O bot utilizará uma Máquina de Estados Finitos para gerenciar o fluxo de criação. Os estados principais serão:
- `IDLE`: Menu Principal.
- `AWAITING_POST_CONTENT`: Usuário envia mídia ou texto.
- `AWAITING_CAPTION`: Se mídia for enviada, usuário decide a legenda.
- `AWAITING_BUTTONS`: Usuário envia botões no formato `Texto -> Link`.
- `FINAL_MENU`: Menu com opções de Notificação, Preview e Confirmação.

## 2. Menu Principal (ReplyKeyboard)
O menu será persistente e conterá:
- `📨 Criar Postagem`: Inicia o fluxo de criação.
- `📊 Estatísticas`: Mostra grupos ativos e alcance.
- `⚙️ Configurações`: (Futuro) Assinaturas e botões favoritos.
- `❓ Ajuda`: Instruções de uso.

## 3. Fluxo de Criação de Postagem
### Etapa 1: Conteúdo
- Suporte a: Texto, Foto, Vídeo, GIF, Documento.
- **Importante**: Capturar `entities` e `media` da mensagem original para preservar formatação e Emojis Premium.

### Etapa 2: Botões (Opcional)
- Formato: `Texto -> Link`.
- Suporte a múltiplos botões por linha e múltiplas linhas.
- Organização automática em grade (máx 2 por linha).

### Etapa 3: Menu Final (InlineKeyboard)
- **Preview**: Exibe a postagem exatamente como será enviada.
- **Toggles**:
    - `🔔 Notificação: ON/OFF`
    - `🌐 Preview Link: ON/OFF`
- **Ações**:
    - `🚀 DISPARAR AGORA`
    - `🗑️ Descartar`

## 4. Preservação de Formatação
- Uso de `parse_mode=None` no Telethon.
- Passagem direta de `entities` da mensagem original para o método `send_message`.

## 5. Integração com Banco de Dados (Supabase)
- Tabela `bot_groups`: Armazena `chat_id`, `title`, `member_count` e `is_active`.
- Registro automático ao ser adicionado como admin em grupos/canais.
