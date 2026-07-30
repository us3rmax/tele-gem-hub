/**
 * Cloudflare Pages Function: /modelo/:slug
 * Proxies to Supabase Edge Function modelo-pages
 * 
 * This is needed because Cloudflare Pages _redirects cannot proxy (200)
 * to external domains with wildcards. We use a Pages Function as middleware.
 */

const SUPABASE_FUNCTIONS_URL = "https://lymjjozpdsdoloahsyey.supabase.co/functions/v1/modelo-pages";

export async function onRequestGet(context) {
  const { params } = context;
  const slug = params.slug;

  if (!slug) {
    return new Response("Modelo não encontrado", { status: 404 });
  }

  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}?slug=${encodeURIComponent(slug)}`, {
      headers: {
        "Accept": "text/html",
      },
      cf: {
        cacheTtl: 3600,
      },
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error proxying to Supabase:", error);
    return new Response("Erro ao carregar a página", { status: 502 });
  }
}
