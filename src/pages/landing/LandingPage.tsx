import { useEffect } from "react";
import { Link } from "react-router-dom";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface GroupItem {
  name: string;
  url: string;
  telegram_link: string;
  member_count: number;
  category: string;
  description: string;
}

export interface LandingPageProps {
  title: string;
  metaDescription: string;
  keyword: string;
  h1: string;
  intro: string;
  groups: GroupItem[];
  faq: FaqItem[];
}

export default function LandingPage({ title, metaDescription, keyword, h1, intro, groups, faq }: LandingPageProps) {
  // Meta tags
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      (meta as HTMLMetaElement).name = "description";
      document.head.appendChild(meta);
    }
    (meta as HTMLMetaElement).content = metaDescription;

    // Schema FAQ
    const schemaId = "faq-schema";
    document.getElementById(schemaId)?.remove();
    const script = document.createElement("script");
    script.id = schemaId;
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
    document.head.appendChild(script);

    return () => {
      document.getElementById(schemaId)?.remove();
    };
  }, [title, metaDescription, faq]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d0a1a] border-b border-gray-800 py-14 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
          <span className="text-[#e91e63]">{keyword.charAt(0).toUpperCase() + keyword.slice(1)}</span>: Os Melhores
          Grupos do Telegram
        </h1>
        <div className="flex justify-center gap-10 my-6 flex-wrap">
          {[
            { num: "1.902", label: "Grupos Ativos" },
            { num: "22", label: "Categorias" },
            { num: "100%", label: "Gratuito" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <span className="block text-3xl font-black text-[#e91e63]">{s.num}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </div>
        <a
          href="/"
          className="inline-block bg-[#e91e63] text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#c2185b] transition-colors"
        >
          Ver Todos os Grupos →
        </a>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Intro */}
        <p className="border-l-4 border-[#e91e63] bg-[#1a1a1a] rounded-r-lg px-6 py-5 text-gray-300 mb-10 leading-relaxed">
          {intro}
        </p>

        {/* Top 10 grupos */}
        <h2 className="text-2xl font-black text-white mb-5 pb-2 border-b border-gray-800">
          🔥 Top 10 Grupos — {h1.split(":")[0]}
        </h2>
        <ul className="flex flex-col gap-3 mb-12">
          {groups.map((g, i) => (
            <li
              key={g.url}
              className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#e91e63] rounded-xl p-4 flex items-center gap-4 transition-colors"
            >
              <span className="text-2xl font-black text-gray-700 w-8 text-center shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">
                  <Link to={g.url} className="hover:text-[#e91e63] transition-colors">
                    {g.name}
                  </Link>
                </h3>
                {g.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{g.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-[#2d0a1a] text-[#e91e63] text-xs px-2 py-0.5 rounded font-semibold uppercase">
                    {g.category}
                  </span>
                  <span className="text-xs text-gray-600">👥 {g.member_count.toLocaleString("pt-BR")} membros</span>
                </div>
              </div>
              <a
                href={g.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-[#e91e63] hover:bg-[#c2185b] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Entrar
              </a>
            </li>
          ))}
        </ul>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-[#e91e63] to-[#880e4f] rounded-xl p-8 text-center mb-12">
          <h2 className="text-white text-xl font-black mb-2">Mais de 1.902 grupos esperando por você</h2>
          <p className="text-pink-100 mb-5">
            Acesse o maior diretório de grupos adultos do Telegram no Brasil. Atualizado todos os dias.
          </p>
          <a
            href="/"
            className="inline-block bg-white text-[#e91e63] font-black px-8 py-3 rounded-lg hover:bg-pink-50 transition-colors"
          >
            Ver todos os grupos grátis →
          </a>
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-black text-white mb-5 pb-2 border-b border-gray-800">❓ Perguntas Frequentes</h2>
        <div className="flex flex-col gap-3">
          {faq.map((item, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">{item.question}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-[#1a1a1a] border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
        <p>
          © 2024{" "}
          <a href="/" className="text-[#e91e63] hover:underline">
            canais18.com
          </a>{" "}
          — O maior diretório de grupos Telegram adultos do Brasil.
        </p>
        <p className="mt-1">Conteúdo exclusivo para maiores de 18 anos.</p>
      </footer>
    </div>
  );
}
