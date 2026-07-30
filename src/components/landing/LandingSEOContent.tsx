/**
 * LandingSEOContent — Componente reutilizável com todos os elementos SEO-campeão
 * 
 * Usado em TODAS as CategoryLanding pages para garantir:
 * - Texto introdutório rico (300+ palavras)
 * - FAQ Section com FAQPage schema
 * - Bottom section com ~500 palavras
 * - Breadcrumb visível
 * - Internal linking entre landing pages
 * - Stats section
 * 
 * Props:
 * - keyword: palavra-chave principal da página (ex: "grupos de putaria no Telegram")
 * - category: nome da categoria (ex: "Putaria")
 * - groupCount: número de grupos na categoria
 * - totalMembers: total de membros na categoria
 * - h1: título H1 da página
 */

import { Link } from "react-router-dom";
import { Users, TrendingUp, Shield, Clock, CheckCircle2, ChevronRight } from "lucide-react";

// ─── Breadcrumb Component ───
function Breadcrumb({ category }: { category: string }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-foreground transition-colors">Canais18</Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <Link to="/categorias" className="hover:text-foreground transition-colors">Categorias</Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-foreground font-medium">{category}</span>
    </nav>
  );
}

// ─── Stats Section ───
function StatsSection({ groupCount, totalMembers }: { groupCount: number; totalMembers: number }) {
  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
  };

  return (
    <div className="grid grid-cols-3 gap-3 my-6">
      <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/50">
        <Users className="h-5 w-5 text-primary mb-1" />
        <span className="text-lg font-bold text-foreground">{formatNum(totalMembers)}</span>
        <span className="text-xs text-muted-foreground">Membros</span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/50">
        <TrendingUp className="h-5 w-5 text-primary mb-1" />
        <span className="text-lg font-bold text-foreground">{groupCount}+</span>
        <span className="text-xs text-muted-foreground">Canais</span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/50">
        <CheckCircle2 className="h-5 w-5 text-primary mb-1" />
        <span className="text-lg font-bold text-foreground">100%</span>
        <span className="text-xs text-muted-foreground">Verificados</span>
      </div>
    </div>
  );
}

// ─── Intro Section (texto acima da dobra) ───
function IntroSection({ keyword, category, h1 }: { keyword: string; category: string; h1: string }) {
  return (
    <div className="space-y-3 mb-6">
      <p className="text-base leading-relaxed text-muted-foreground">
        Encontre os melhores <strong>{keyword}</strong> do Telegram em um só lugar. 
        O Canais18 reúne canais verificados de <strong>{category}</strong> com conteúdo atualizado diariamente. 
        Cada link é testado antes de ser publicado, garantindo que você acesse apenas grupos ativos e funcionais.
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Links verificados
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
          <Shield className="h-3 w-3" /> Sem spam
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">
          <Clock className="h-3 w-3" /> Atualização diária
        </span>
      </div>
    </div>
  );
}

// ─── Internal Linking Section ───
function InternalLinking() {
  const links = [
    { path: "/telegram-putaria", label: "Putaria Telegram" },
    { path: "/vazados-telegram", label: "Vazados Telegram" },
    { path: "/onlyfans-telegram", label: "OnlyFans Telegram" },
    { path: "/telegram-xxx", label: "Telegram XXX" },
    { path: "/grupos-telegram-18", label: "Telegram 18+" },
    { path: "/telegram-porno", label: "Telegram Porno" },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5 my-8">
      <h2 className="text-lg font-semibold text-card-foreground mb-3">Explorar Mais Categorias</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── FAQ Section (com FAQPage schema via Helmet/seo) ───
interface FAQItem {
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "Os canais de Telegram são seguros?",
    answer: "Sim, os canais listados no Canais18 são verificados diariamente. O Telegram é uma plataforma legítima com criptografia de ponta a ponta nas mensagens. Recomendamos nunca compartilhar informações pessoais nos grupos.",
  },
  {
    question: "Como entrar em um canal do Telegram?",
    answer: "Basta clicar no botão 'Entrar no Canal' ao lado do grupo desejado. O link abrirá diretamente no app do Telegram (ou no navegador, se você não tiver o app instalado).",
  },
  {
    question: "Os links são verificados com que frequência?",
    answer: "Todos os links são verificados diariamente pela nossa equipe. Canais que ficam inativos ou são removidos pelo Telegram são removidos automaticamente do nosso diretório.",
  },
  {
    question: "Posso sugerir um novo canal?",
    answer: "Sim! Acesse a página /submit e envie o link do canal que deseja sugerir. Nossa equipe verifica e adiciona canais que seguem nossos critérios de qualidade.",
  },
  {
    question: "O Canais18 é gratuito?",
    answer: "Sim, o acesso ao diretório é 100% gratuito. Não pedimos cadastro, pagamento ou qualquer tipo de registro para acessar os links dos canais.",
  },
];

function FAQSection({ faqs = DEFAULT_FAQS }: { faqs?: FAQItem[] }) {
  return (
    <section className="my-8 space-y-3">
      <h2 className="text-xl font-bold text-foreground">Perguntas Frequentes</h2>
      {faqs.map((faq, i) => (
        <details key={i} className="group rounded-lg border border-border bg-card">
          <summary className="flex items-center justify-between p-4 cursor-pointer">
            <span className="font-medium text-card-foreground">{faq.question}</span>
            <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            {faq.answer}
          </div>
        </details>
      ))}
    </section>
  );
}

// ─── Bottom Section (texto SEO rico ~500 palavras) ───
function BottomSection({ keyword, category }: { keyword: string; category: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 my-8">
      <h2 className="text-xl font-bold text-card-foreground mb-4">
        O Guia Completo de {keyword}
      </h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          O Telegram se tornou uma das plataformas mais populares para comunidades de adultos no Brasil. 
          Com mais de 800 milhões de usuários globais e criptografia robusta, o app oferece um ambiente 
          seguro para criadores e consumidores de conteúdo exclusivo. No Canais18, reunimos os melhores 
          <strong> {keyword}</strong> em um diretório verificado e atualizado diariamente.
        </p>
        <p>
          Navegar por <strong>canais de {category} no Telegram</strong> pode ser confuso sem orientação. 
          Existem milhares de grupos ativos, mas muitos estão abandonados, contêm spam ou têm links quebrados. 
          Nossa equipe testa cada canal antes de publicá-lo, garantindo que você encontre apenas conteúdo 
          de qualidade e grupos com atividade real.
        </p>
        <h3 className="text-base font-semibold text-card-foreground pt-2">Como Funcionam os Canais do Telegram</h3>
        <p>
          Canais do Telegram são espaços de comunicação onde um administrador pode compartilhar conteúdo 
          com um número ilimitado de assinantes. Diferente dos grupos de chat, canais são ideais para 
          distribuir fotos, vídeos e links de forma organizada. Os criadores mais populares no Telegram 
          compartilham conteúdo exclusivo que não está disponível em outras plataformas.
        </p>
        <h3 className="text-base font-semibold text-card-foreground pt-2">Dicas de Segurança</h3>
        <p>
          Ao acessar <strong>grupos de {category} no Telegram</strong>, recomendamos: nunca compartilhar 
          dados pessoais (nome real, telefone, localização), usar um nome de usuário diferente do seu nome 
          real, e evitar clicar em links suspeitos dentro dos grupos. O Telegram possui configuração de 
          privacidade robusta — ative a verificação em duas etapas para proteger sua conta.
        </p>
        <h3 className="text-base font-semibold text-card-foreground pt-2">Por Que Usar o Canais18</h3>
        <p>
          O Canais18 é o maior diretório de <strong>{keyword}</strong> do Brasil. Com atualização diária, 
          verificação manual de cada link e organização por categoria, oferecemos a melhor experiência para 
          encontrar canais de qualidade. Diferente de listas compartilhadas em grupos de spam, nosso 
          diretório é limpo, atualizado e verificado.
        </p>
      </div>
    </section>
  );
}

// ─── Main Export ───
interface LandingSEOContentProps {
  keyword: string;
  category: string;
  h1: string;
  groupCount: number;
  totalMembers: number;
  faqs?: FAQItem[];
}

export default function LandingSEOContent({
  keyword,
  category,
  h1,
  groupCount,
  totalMembers,
  faqs = DEFAULT_FAQS,
}: LandingSEOContentProps) {
  // Also inject FAQPage schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div>
      {/* Inject FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Breadcrumb category={category} />
      <IntroSection keyword={keyword} category={category} h1={h1} />
      <StatsSection groupCount={groupCount} totalMembers={totalMembers} />
      <InternalLinking />
      <FAQSection faqs={faqs} />
      <BottomSection keyword={keyword} category={category} />
    </div>
  );
}

export { DEFAULT_FAQS };
export type { FAQItem };
