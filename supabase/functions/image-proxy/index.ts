import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache: 24 hours for images
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
  "Content-Type": "image/jpeg",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return new Response(
      JSON.stringify({ error: "Missing 'url' parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate URL - must be from image.privacy.com.br
  try {
    const targetUrl = new URL(imageUrl);
    if (targetUrl.hostname !== "image.privacy.com.br") {
      return new Response(
        JSON.stringify({ error: "Invalid image source" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid URL format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Fetch the image with Privacy headers
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://privacy.com.br/",
        "Origin": "https://privacy.com.br",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Image fetch failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read the image data
    const imageBuffer = await response.arrayBuffer();

    // Determine content type from response
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to proxy image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
