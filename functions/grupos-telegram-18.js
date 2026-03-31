export async function onRequest() {
  const resp = await fetch('https://lymjjozpdsdoloahsyey.supabase.co/functions/v1/landing-pages?page=grupos-telegram-18');
  const html = await resp.text();
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
}
