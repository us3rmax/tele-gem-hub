export interface Grupo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  telegram_link: string;
  member_count: number;
  is_premium: boolean;
  is_verified: boolean;
  created_at: string;
}

// Keep legacy types for anything still using them
export interface Anuncio {
  id: string;
  titulo: string;
  imagem_url: string;
  link: string;
  ativo: boolean;
  posicao: "topo" | "meio";
}

export const mockAnuncios: Anuncio[] = [
  {
    id: "a-1",
    titulo: "🔥 Anuncie aqui — Alcance milhares de traders",
    imagem_url: "https://picsum.photos/seed/ad-top/1200/400",
    link: "https://example.com/anunciar",
    ativo: true,
    posicao: "topo",
  },
];
