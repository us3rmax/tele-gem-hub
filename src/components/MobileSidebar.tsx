import { useState } from "react";
import { X, Send, User, BookOpen, Flame, Clock, Eye, ThumbsUp, Grid3X3, Mail, FileText, Home, FolderOpen, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onSort: (sort: string) => void;
  activeSort: string;
}

const menuItems = [
  { icon: Home, label: "Página Inicial", action: "home" },
  { icon: Send, label: "Enviar Grupo", action: "enviar", requiresAuth: true },
  { icon: FolderOpen, label: "Meus Grupos", action: "meusgrupos", requiresAuth: true },
  { icon: BookOpen, label: "Blog", action: "blog" },
];

const sortItems = [
  { icon: Flame, label: "Em alta", sort: "hot" },
  { icon: Clock, label: "Mais recentes", sort: "recentes" },
  { icon: Eye, label: "Mais vistos", sort: "vistos" },
  { icon: ThumbsUp, label: "Mais votados", sort: "votados" },
];

const extraItems = [
  { icon: Grid3X3, label: "Categorias", action: "categorias" },
  { icon: Mail, label: "Contato", action: "contato" },
  { icon: FileText, label: "Termos de Uso", action: "termos" },
];

const SidebarSearch = ({ onClose }: { onClose: () => void }) => {
  const [term, setTerm] = useState("");
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = term.trim();
    nav(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : "/");
    onClose();
  };

  return (
    <form onSubmit={submit} className="relative mb-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar grupos..."
        className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </form>
  );
};

const MobileSidebar = ({ open, onClose, onSort, activeSort }: MobileSidebarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const authGuard = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate(`/auth/login?returnUrl=${encodeURIComponent(path)}`);
    }
    onClose();
  };

  const handleMenuClick = (action: string, requiresAuth?: boolean) => {
    const routes: Record<string, string> = {
      home: "/",
      enviar: "/submit",
      meusgrupos: "/my-groups",
      categorias: "/categorias",
      contato: "/contato",
    };
    const path = routes[action];
    if (!path) return;

    if (requiresAuth) {
      authGuard(path);
    } else {
      navigate(path);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-background transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-lg font-bold">
            <span className="text-primary">TG</span>Index
          </span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <SidebarSearch onClose={onClose} />

          {menuItems.map((item) => (
            <button key={item.action} onClick={() => handleMenuClick(item.action, item.requiresAuth)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}

          <div className="my-3 border-t border-border" />
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Ordenar</p>
          {sortItems.map((item) => (
            <button
              key={item.sort}
              onClick={() => { onSort(item.sort); onClose(); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${activeSort === item.sort ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}

          <div className="my-3 border-t border-border" />
          {extraItems.map((item) => (
            <button key={item.action} onClick={() => handleMenuClick(item.action)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default MobileSidebar;
