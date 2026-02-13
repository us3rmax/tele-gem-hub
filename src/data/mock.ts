export interface Grupo {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  imagem_url: string;
  link_telegram: string;
  membros: number;
  visualizacoes: number;
  votos: number;
  premium: boolean;
  hot: boolean;
  verificado: boolean;
  criado_em: string;
}

export interface Anuncio {
  id: string;
  titulo: string;
  imagem_url: string;
  link: string;
  ativo: boolean;
  posicao: "topo" | "meio";
}

const categorias = ["Crypto", "NFTs", "DeFi", "Trading", "Airdrops", "Play2Earn", "Web3", "Metaverse"];

function randomDate(daysAgo: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.floor(Math.random() * daysAgo * 24 * 60));
  return d.toISOString();
}

export const mockGrupos: Grupo[] = Array.from({ length: 36 }, (_, i) => ({
  id: `g-${i + 1}`,
  nome: [
    "Crypto Whales 🐋", "DeFi Alpha", "NFT Hunters", "Airdrop Alerts 🚀",
    "Trading Signals Pro", "Web3 Devs", "Metaverse Land", "Play2Earn Hub",
    "Bitcoin Brasil", "Ethereum Maxis", "Solana Builders", "BNB Chain",
    "Polygon Network", "Avalanche AVAX", "Cardano ADA", "XRP Community",
    "Shiba Army", "Doge Nation", "Chainlink Oracles", "Uniswap Traders",
    "Pancake Swap", "OpenSea Drops", "Blur NFTs", "Magic Eden",
    "Axie Infinity", "StepN Runners", "Sandbox World", "Decentraland",
    "Cosmos Hub", "Polkadot DOT", "Near Protocol", "Fantom FTM",
    "Arbitrum L2", "Optimism OP", "zkSync Era", "Base Chain"
  ][i],
  descricao: "Comunidade ativa de entusiastas crypto com sinais diários e análises.",
  categoria: categorias[i % categorias.length],
  imagem_url: `https://picsum.photos/seed/tg${i + 1}/400/300`,
  link_telegram: `https://t.me/grupo${i + 1}`,
  membros: Math.floor(Math.random() * 50000) + 500,
  visualizacoes: Math.floor(Math.random() * 10000),
  votos: Math.floor(Math.random() * 5000),
  premium: i < 6,
  hot: i % 5 === 0,
  verificado: i % 3 === 0,
  criado_em: randomDate(30),
}));

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
