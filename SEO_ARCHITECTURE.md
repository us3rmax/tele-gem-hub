# Arquitetura SEO & Ecossistema Técnico — Canais18.com

Este documento detalha a integração entre o Banco de Dados (Supabase), Edge Functions, Cloudflare e o Front-end, servindo como o mapa mental oficial para o desenvolvimento e otimização de SEO do projeto.

---

## 1. Fluxo de Dados e Renderização (SSR vs SPA)

O projeto utiliza uma estratégia híbrida para maximizar a performance e a indexação:

| Componente | Função | Tecnologia |
| :--- | :--- | :--- |
| **Front-end** | Aplicação principal (SPA) para utilizadores. | React (Vite) + Tailwind CSS |
| **Cloudflare Worker** | Interceta pedidos de bots e redireciona para SSR. | `bot-prerender` |
| **Edge Functions** | Renderizam HTML estático para SEO em tempo real. | Supabase Edge Functions (Deno) |
| **Banco de Dados** | Armazenamento de grupos, categorias e cache SEO. | PostgreSQL (Supabase) |

### 1.1. O "Bot-Prerender"
Quando um crawler (Googlebot, Bingbot) acede a uma URL de categoria ou grupo, o **Cloudflare Worker** identifica o `User-Agent` e serve o HTML gerado pela Edge Function `landing-pages`. Isso garante que o bot receba conteúdo 100% renderizado (SSR) com cabeçalhos `X-Landing-Source`.

---

## 2. Estrutura de URLs e Slugs

A blindagem dos slugs é crítica para evitar URLs de spam e garantir autoridade.

*   **Páginas Estáticas:** `/contato`, `/submit`, `/privacy`, `/blog`.
*   **Páginas de Categoria (Landing Pages):** `/telegram-putaria`, `/novinhas-telegram`, etc.
    *   Mapeadas no ficheiro `src/pages/CategoryLanding.tsx` e sincronizadas na Edge Function `landing-pages`.
*   **Páginas de Grupo:** `/group/{slug}`.
    *   **Regra:** O `slug` é agora `NOT NULL` e `UNIQUE` no banco de dados.
    *   **Fallback:** O sistema ainda suporta URLs antigas com ID de 32 caracteres para manter a compatibilidade com links já indexados, mas gera apenas o slug puro internamente.

---

## 3. Lógica de Dados (Hooks & Supabase)

O Front-end utiliza o **TanStack Query** para gestão de estado e cache.

### 3.1. `useGroups` & Paginação
*   **Localização:** `src/hooks/use-groups.ts`.
*   **Filtros:** `hot` (score baseado em views + clicks), `vistos`, `votados`, `recentes`.
*   **Paginação:** Realizada via `.range(from, to)` no Supabase, com 20 itens em mobile e 24 em desktop.

### 3.2. `useGroupDetail`
*   Tenta encontrar o grupo por:
    1.  Slug exato.
    2.  Short ID (8 caracteres) no final do slug.
    3.  UUID completo (32 caracteres) para compatibilidade legada.

---

## 4. Pipeline de Indexação (Google Indexing API)

A indexação é gerida por scripts automatizados que rodam via **GitHub Actions**.

| Script | Frequência | Objetivo |
| :--- | :--- | :--- |
| `generate-sitemap.ts` | On-demand | Gera o `sitemap.xml` dinamicamente via Edge Function. |
| `update_seo_cache.py` | Diário (14h BRT) | Recolhe dados do GSC e atualiza a tabela `seo_cache`. |
| `gsc_health_monitor.py` | Diário | Monitoriza a saúde da indexação e envia alertas de queda de tráfego. |
| `master_health_check.py` | Diário | Validação completa de SSR, Sitemap, Cloudflare e Supabase. |

**Fluxo da Indexing API:**
O sistema monitoriza a tabela `indexing_progress` no Supabase para controlar o envio de URLs (limite de 33 URLs por dia por projeto) para a Google Indexing API, garantindo que novos grupos sejam indexados quase instantaneamente.

---

## 5. Regras de Ouro para o Desenvolvimento

1.  **Nunca quebrar o SSR:** Qualquer alteração em `CategoryLanding.tsx` deve ser refletida na Edge Function `landing-pages`.
2.  **Slugs são Sagrados:** O campo `slug` no banco de dados deve ser sempre populado. Nunca usar o ID de 32 caracteres em novas URLs.
3.  **Monitorização:** Se o `master_health_check.py` falhar, o deploy deve ser investigado imediatamente.
4.  **Consistência de www:** Todas as URLs devem forçar o uso de `www.canais18.com` para evitar conteúdo duplicado.

---
*Documento gerado pelo Engenheiro Chefe e Diretor de SEO (Manus AI) em 19 de Maio de 2026.*
