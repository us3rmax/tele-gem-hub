import { Link } from "react-router-dom";

const links = [
  { to: "/privacy", label: "Política de Privacidade" },
  { to: "/terms", label: "Termos de Uso" },
  { to: "/dmca", label: "DMCA" },
  { to: "/2257", label: "2257" },
  { to: "/removal", label: "Remoção de Links" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
];

const Footer = () => (
  <footer className="border-t border-border bg-card py-6">
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
        {links.map((link, i) => (
          <span key={link.to} className="flex items-center gap-2">
            {i > 0 && <span>|</span>}
            <Link to={link.to} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          </span>
        ))}
      </div>
      <div className="mt-4 text-center text-xs text-muted-foreground">
        © 2026 Canais18. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
