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

    const { emails, subject, message } = await req.json();
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "Emails array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let successCount = 0;
    for (const email of emails) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Canais18 <noreply@canais18.com>",
            to: email,
            subject: subject || "⚠️ Atualização sobre seu grupo no Canais18",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff; border-radius: 12px;">
                <h2 style="color: #3b82f6; text-align: center;">Canais18 Portal</h2>
                <p style="white-space: pre-line; line-height: 1.6; color: #d1d5db;">${message}</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://www.canais18.com/my-groups" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Meus Envios</a>
                </div>
                <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 40px;">Este é um e-mail automático enviado pelo Canais18.</p>
              </div>
            `,
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json();
          console.error(`Failed to send email to ${email}:`, errData);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Error sending email to ${email}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, successCount, totalEmails: emails.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email-broadcast error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
