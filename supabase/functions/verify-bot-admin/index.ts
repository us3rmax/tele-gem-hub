import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BOT_TOKEN = Deno.env.get("TG_BOT_TOKEN");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const { telegramLink } = await req.json();
    
    if (!telegramLink) {
      return new Response(JSON.stringify({ error: "Link do Telegram é obrigatório" }), { status: 400 });
    }

    // Extrair o username ou ID do link
    // Formatos aceitos: https://t.me/username, @username, username
    let identifier = telegramLink.replace("https://t.me/", "").replace("@", "").trim();
    
    if (!identifier) {
      return new Response(JSON.stringify({ error: "Identificador inválido" }), { status: 400 });
    }

    // Chamar a API do Telegram: getChatMember
    // Precisamos primeiro pegar o ID do chat ou usar o username público
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=@${identifier}&user_id=${BOT_TOKEN.split(":")[0]}`);
    const data = await response.json();

    if (!data.ok) {
      // Se falhar com @username, pode ser um grupo privado ou erro de identificação
      return new Response(JSON.stringify({ 
        isAdmin: false, 
        message: "Bot não encontrado no canal ou canal é privado/inválido.",
        details: data.description 
      }), { 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    const status = data.result.status;
    const isAdmin = ["administrator", "creator"].includes(status);

    return new Response(JSON.stringify({ 
      isAdmin,
      status,
      message: isAdmin ? "✅ Bot é administrador!" : "❌ Bot está no canal, mas não é administrador."
    }), { 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
})
