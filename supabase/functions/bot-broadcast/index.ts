import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { data: adminRole } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message } = await req.json();
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = Deno.env.get("TG_BOT_TOKEN") || "8512413789:AAECik5KNiYytYv2rPQVlPg8PoKxO-UlnaU";
    if (!botToken) {
      return new Response(JSON.stringify({ error: "TG_BOT_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: groups, error: groupsError } = await supabase
      .from("bot_groups")
      .select("chat_id")
      .eq("is_active", true);

    if (groupsError) throw groupsError;

    if (!groups || groups.length === 0) {
      return new Response(JSON.stringify({ message: "No active groups found", sentCount: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    for (const group of groups) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: group.chat_id,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
        const result = await res.json();
        if (result.ok) {
          sentCount++;
        } else {
          console.error(`Failed to send to chat ${group.chat_id}:`, result);
          if (result.error_code === 403 || result.error_code === 400) {
            // Mark as inactive if bot was blocked or chat not found
            await supabase
              .from("bot_groups")
              .update({ is_active: false })
              .eq("chat_id", group.chat_id);
          }
        }
        // Delay 300ms to avoid Telegram rate limits
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Error sending to group ${group.chat_id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount, totalGroups: groups.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bot-broadcast error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
